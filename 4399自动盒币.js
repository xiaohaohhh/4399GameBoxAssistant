// 最简配置
const CONFIG = {
    DELAYS: {
        TASK_INTERVAL: 2000,     // 任务间隔
        PAGE_LOAD: 8000,         // 页面加载等待
        ANIMATION: 2000,         // 动画过渡
        LONG_WAIT: 8000,         // 长等待
        SHORT_WAIT: 1000,        // 短等待
        VERY_LONG_WAIT: 18000    // 超长等待
    }
};

// 扩展的Logger
const Logger = {
    info: function(message, showToast) {
        console.info(message);
        if (showToast) {
            log(message);
        }
    },
    
    debug: function(message) {
        console.verbose(message);
    },
    
    warn: function(message, showToast) {
        console.warn(message);
        if (showToast) {
            toastLog("警告: " + message);
        }
    },
    
    error: function(message, error, showToast) {
        console.error(message);
        if (error) {
            console.error(error.stack || error);
        }
        if (showToast) {
            toastLog("错误: " + message);
        }
    },
    
    taskStart: function(taskName) {
        this.info(`========== 开始执行任务: ${taskName} ==========`, true);
    },
    
    taskEnd: function(taskName, success) {
        const status = success ? '成功' : '失败';
        this.info(`========== 任务: ${taskName} ${status} ==========`, true);
    }
};

const DELAYS = CONFIG.DELAYS;

// 基本初始化
auto.waitFor();
Logger.info("开始脚本", true);

threads.start(function() {
    text("立即开始").findOne().click();
});

requestScreenCapture();

// 基本参数
let defaultX = 1080;
let defaultY = 2400;
let imagesPath = "/storage/emulated/0/脚本/图片/4399游戏盒/";

// 辅助函数
function clicks(intX, intY) {
    let x = intX / defaultX * device.width;
    let y = intY / defaultY * device.height;
    return click(x, y);
}

function clickBounds(kj) {
    var kjs = kj.bounds();
    var x = kjs.centerX();
    var y = kjs.centerY();
    return clicks(x, y);
}

/**
 * 找图函数
 * @param {string} small1 - 要查找的小图路径
 * @param {number} a - x坐标偏移量
 * @param {number} b - y坐标偏移量
 * @param {string} msg - 日志消息
 * @param {boolean} needClick - 是否需要点击找到的坐标
 * @returns {boolean|object} - 如果needClick为true返回是否点击成功，为false则返回找到的坐标点或null
 */
function finding(small1, a, b, msg, needClick) {
    Logger.debug("开始--" + msg);
    let big = captureScreen();
    sleep(DELAYS.ANIMATION);
    if (big == null) {
        Logger.error("截图失败");
        return needClick ? false : null;
    }
    let small11 = images.read(small1);
    if (small11 == null) {
        Logger.error("例子图片不存在");
        return needClick ? false : null;
    }

    let sx = device.width / 1080;
    let sy = device.height / 2400;
    let small = images.scale(small11, sx, sy);
    small11.recycle();
    if (small == null) {
        Logger.error("图标缩放失败");
        return needClick ? false : null;
    }
    
    let p = findImage(big, small);
    small.recycle();
    big.recycle();
    if (p) {
        Logger.debug(`找到--小图标的坐标：${p.x}/${p.y}`);
        if (needClick) {
            click(p.x + a, p.y + b);
            sleep(DELAYS.ANIMATION);
            Logger.debug("结束--" + msg);
            return true;
        }
        return p;  // 如果不需要点击，返回找到的坐标点
    }
    
    Logger.warn(msg + "失败，没有找到该图标");
    return needClick ? false : null;  // 根据needClick参数返回对应的失败值
}

/**
 * 检查并解锁每日任务
 * @returns {boolean} 返回true表示任务已解锁（无论是刚解锁还是之前已解锁），false表示解锁失败
 */
function UnlockDailyTasks() {
    Logger.info("检查每日任务解锁状态");
    
    // 查找解锁按钮
    var unlockButton = className("android.widget.TextView")
        .text("解锁今日任务")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!unlockButton) {
        Logger.info("今日任务已经解锁");
        return true;
    }
    
    // 如果找到解锁按钮，点击解锁
    if (unlockButton.text() === "解锁今日任务") {
        Logger.info("发现未解锁的每日任务，准备解锁");
        if (clickBounds(unlockButton)) {
            Logger.info("成功点击解锁按钮");
            sleep(DELAYS.ANIMATION);
            return true;
        } else {
            Logger.error("点击解锁按钮失败");
            return false;
        }
    }
    
    return true;
}

/**
 * 检查并点击社区标签
 * @returns {boolean} 是否成功点击社区标签
 */
function CheckAndClickCommunityTab() {
    Logger.info("检查社区标签状态");
    
    // 先检查是否已经在社区页面（绿色图标）
    var selectedIcon = finding(imagesPath + "社区-选中.jpg", 1, 1, "检查社区标签是否 “已选中”");
    if (selectedIcon) {
        Logger.info("已经在社区页面");
        return true;
    }
    
    // 如果不在社区页面，查找并点击未选中的图标（灰色图标）
    var unselectedIcon = finding(imagesPath + "社区-未选中.jpg", 1, 1, "查找 “未选中”  的社区标签",true);
    if (unselectedIcon) {
        Logger.info("找到未选中的社区标签，点击进入社区页面");
        sleep(DELAYS.ANIMATION);
        return true;
    }
    
    Logger.error("未能找到社区标签");
    return false;
}

/**
 * 修改签到函数，加入滑块验证处理
 * @returns {boolean} 返回true表示签到成功或已经签到，false表示签到失败
 */
function DailySignIn() {
    Logger.info("检查每日签到状态");
    
    // 查找签到按钮
    var signInButton = id("btn_sign_in")
        .text("签到")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!signInButton) {
        Logger.info("未找到签到按钮，可能已经签到过了");
        return true;
    }
    
    Logger.info("找到签到按钮，准备签到");
    if (!clickBounds(signInButton)) {
        Logger.error("点击签到按钮失败");
        return false;
    }
    
    sleep(DELAYS.ANIMATION);
    
    /**
     
    // 处理可能出现的滑块验证
    const MAX_VERIFY_ATTEMPTS = 3;
    let verifyAttempts = 0;
    
    while (verifyAttempts < MAX_VERIFY_ATTEMPTS) {
        if (handleSliderVerification()) {
            break;
        }
        verifyAttempts++;
        if (verifyAttempts < MAX_VERIFY_ATTEMPTS) {
            Logger.info(`滑块验证失败，第 ${verifyAttempts + 1} 次重试`);
            sleep(DELAYS.ANIMATION);
        }
    }
    
    if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        Logger.error("滑块验证多次失败，签到终止");
        return false;
    }
        */
    
    // 验证签到结果
    var signInResult = className("android.widget.TextView")
        .depth("14")
        .indexInParent("0")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (signInResult && signInResult.text().includes("签到成功")) {
        Logger.info("签到成功，获得5盒币");
        sleep(DELAYS.ANIMATION);
        
        // 关闭签到成功弹窗
        var closeButton = className("android.widget.TextView")
            .depth("14")
            .clickable(true)
            .indexInParent("3")
            .findOne(DELAYS.PAGE_LOAD);
            
        if (closeButton && clickBounds(closeButton)) {
            Logger.info("关闭签到成功弹窗");
            return true;
        } else {
            Logger.warn("未能找到或点击关闭按钮，但签到已成功");
            return true;
        }
    } else {
        Logger.warn("签到失败或已经签到过了");
        return false;
    }
}

/**
 * 强制停止并重启应用
 * @returns {boolean} 是否成功执行
 */
function ForceStopAndRestart() {
    Logger.info("准备强制停止应用");
    try {
        app.openAppSetting("com.m4399.gamecenter");
        sleep(DELAYS.PAGE_LOAD);
        
        // 点击"强行停止"按钮
        let forceStopBtn = textMatches(/(强.停止|强制.*停止|.*强制停止.*|强行.*停止|结束运行)/).findOne(DELAYS.PAGE_LOAD);
        if (forceStopBtn) {
            clickBounds(forceStopBtn);
            sleep(DELAYS.ANIMATION);
            
            // 点击确认弹窗
            let confirmBtn = textMatches(/(确定|确认)/).findOne(DELAYS.PAGE_LOAD);
            if (confirmBtn) {
                clickBounds(confirmBtn);
                Logger.info("已强制停止APP");
                sleep(DELAYS.PAGE_LOAD);
                
                // 返回键退出应用设置
                back();
                sleep(DELAYS.ANIMATION);
                return true;
            }
        }
        return false;
    } catch (error) {
        Logger.error("强制停止APP时出错", error);
        return false;
    }
}

/**
 * 打开并验证每日任务页面
 * @returns {boolean} 是否成功打开每日任务页面
 */
function OpenDailyTaskPage() {
    Logger.info("开始打开每日任务页面");
    
    // 最大重试次数
    const MAX_RETRIES = 3;
    const MAX_FORCE_STOP_RETRIES = 2;
    let tryCount = 0;
    let forceStopCount = 0;
    
    while (forceStopCount < MAX_FORCE_STOP_RETRIES) {
        tryCount = 0;
        while (tryCount < MAX_RETRIES) {
            // 尝试打开每日任务页面
            app.startActivity({
                action: "android.intent.action.MAIN",
                packageName: "com.m4399.gamecenter",
                className: "com.m4399.gamecenter.plugin.main.controllers.task.EveryDayTaskActivity",
                root: true,
            });
            Logger.info(`第 ${tryCount + 1} 次尝试打开每日任务页面`);
            sleep(DELAYS.PAGE_LOAD);
            
            // 验证页面是否正确打开
            var dailyTaskLabel = id("tv_title").text("每日任务").findOne(DELAYS.PAGE_LOAD);
            var dailySignIn = id("tv_title").text("每日签到").findOne(DELAYS.PAGE_LOAD);
            
            if (dailyTaskLabel && dailySignIn) {
                Logger.info("每日任务页面已成功打开");
                return true;
            }
            
            // 如果页面未正确打开，等待后重试
            Logger.warn(`第 ${tryCount + 1} 次打开失败，等待重试...`);
            sleep(DELAYS.LONG_WAIT);
            tryCount++;
        }
        
        // 如果常规重试失败，尝试强制停止APP
        if (forceStopCount < MAX_FORCE_STOP_RETRIES) {
            Logger.warn("常规重试失败，尝试强制停止并重启应用");
            if (ForceStopAndRestart()) {
                forceStopCount++;
                Logger.info(`强制停止后第 ${forceStopCount} 次重试`);
                sleep(DELAYS.LONG_WAIT);
                continue;
            } else {
                Logger.error("强制停止应用失败");
                return false;
            }
        }
    }
    
    Logger.error(`在 ${MAX_RETRIES} 次常规重试和 ${MAX_FORCE_STOP_RETRIES} 次强制停止重试后仍未能打开每日任务页面`);
    return false;
}

// 赛尔号页游签到
function SaiErHaoQianDao() {
    Logger.info("执行任务: 赛尔号页游签到");
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.favorites.FavoriteActivity",
        root: true,
    });
    Logger.info("打开 我的收藏页面");
    sleep(DELAYS.PAGE_LOAD);

    //切换到活动标签栏
    var activityControl = textMatches(/活动.*/).id("tv_tab_title").depth("12").className("android.widget.TextView").findOne(DELAYS.PAGE_LOAD);
    if (activityControl) {
        Logger.info("点击活动标签");
        clickBounds(activityControl);
        sleep(DELAYS.PAGE_LOAD);
        
        //点击赛尔号活动
        var huoDong = text("《赛尔号》页游签到领米币、通用刻印激活水晶等独家礼包！").findOne(DELAYS.PAGE_LOAD);
        if (huoDong) {
            Logger.info("点击活动，正在进入");
            clickBounds(huoDong);
            sleep(DELAYS.PAGE_LOAD);
            
            // 检查签到状态
            var qianDao = text("点击签到").findOne(DELAYS.PAGE_LOAD);
            var yiQianDao = text("今日已签到").findOne(DELAYS.PAGE_LOAD);
            
            if (qianDao) {
                Logger.info("发现未签到，准备进行签到");
                clickBounds(qianDao);
                sleep(DELAYS.PAGE_LOAD);
            } else if (yiQianDao) {
                Logger.info("今日已经完成签到");
            } else {
                Logger.info("未找到签到按钮，检查是否可以抽取福利");
            }
            
            // 抽取每日福利
            var dailyWelfare = text("抽取今日福利").depth(15).findOne(DELAYS.PAGE_LOAD);
            if (dailyWelfare) {
                Logger.info("开始抽取每日奖励");
                clickBounds(dailyWelfare);
                sleep(DELAYS.PAGE_LOAD);
                
                var ok = text("好的").findOne(DELAYS.PAGE_LOAD);
                if (ok) {
                    clickBounds(ok);
                    Logger.info("签到/抽奖流程完成");
                    return true;
                }
            } else {
                Logger.info("没有找到每日福利按钮或已经抽取过了");
            }
        } else {
            Logger.info("没有找到赛尔号活动");
        }
    } else {
        Logger.info("没有找到活动标签");
    }

    // 最后检查一次是否有未抽取的福利
    var finalCheck = text("抽取今日福利").depth(15).findOne(DELAYS.PAGE_LOAD);
    if (finalCheck) {
        Logger.info("发现未抽取的福利，进行最后抽取");
        clickBounds(finalCheck);
        sleep(DELAYS.PAGE_LOAD);
        var ok = text("好的").findOne(DELAYS.PAGE_LOAD);
        if (ok) {
            clickBounds(ok);
            Logger.info("最终抽奖完成");
            return true;
        }
    }

    // 如果已经签到并且没有找到"抽取今日福利"按钮，说明任务已完成
    if (text("今日已签到").exists()) {
        Logger.info("今日任务已全部完成");
        return true;
    }

    Logger.info("任务状态未知，可能已完成或出现异常");
    return true;  // 返回true避免重复尝试
}

// 早起打卡函数
function GetUp() {
    Logger.info("执行任务: 早起打卡");
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.search.SearchGameActivity",
        root: true,
    });
    Logger.info("打开搜索框页面");
    sleep(DELAYS.PAGE_LOAD);

    // 查找搜索框
    var searchBox = className("android.widget.EditText").findOne(DELAYS.PAGE_LOAD);
    if (searchBox) {
        Logger.info("找到搜索框，准备输入");
        searchBox.setText("11109");
        sleep(DELAYS.ANIMATION);

        // 点击参与按钮
        var participateButton = className("android.widget.TextView").id("get").text("点击参与").findOne(DELAYS.PAGE_LOAD);
        if (participateButton) {
            Logger.info("点击参与按钮");
            clickBounds(participateButton);
            sleep(DELAYS.PAGE_LOAD);

            // 检查是否已经报名等待明天打卡
            var waitTomorrowResult = finding(imagesPath + "早起打卡-等待明日打卡.jpg", 1, 1, "检查是否等待明日打卡", false);
            if (waitTomorrowResult) {
                Logger.info("已经报名成功，等待明天6:00-9:00打卡");
                return true;  // 已报名等待打卡也算成功
            }

            // 先检查是否需要投资
            var investButton = finding(imagesPath + "早起打卡-投资5盒币报名.jpg", 1, 1, "开始第一次投资5盒币", true);
            if (investButton) {
                Logger.info("投资5盒币报名明日打卡");
                sleep(DELAYS.PAGE_LOAD);  // 等待报名结果
                
                // 检查是否报名成功
                var signUpSuccess = className("android.widget.TextView").depth("15").text("报名成功").findOne(DELAYS.PAGE_LOAD);
                if (signUpSuccess) {
                    Logger.info("首次报名成功，明天可以打卡");
                    return true;
                } else {
                    Logger.warn("没有找到报名成功提示");
                    return false;
                }
            }

            // 如果不需要投资，说明昨天已经投资过，现在可以打卡
            var daKaButton = finding(imagesPath + "早起打卡-打卡.jpg", 1, 1, "开始完成 早起打卡", true);
            if (daKaButton) {
                Logger.info("找到打卡按钮，准备点击打卡按钮");
                sleep(DELAYS.ANIMATION);

                // 检查打卡结果，这里只需要检查不需要点击
                var daKaResult = finding(imagesPath + "早起打卡-打卡成功.jpg", 1, 1, "检查打卡结果", false);
                if (daKaResult) {
                    Logger.info("打卡成功，坐标：" + daKaResult.x + "," + daKaResult.y);
                    //需要点击继续投资5盒币，报名每天的打卡
                    var continuedInvestment = finding(imagesPath + "早起打卡-继续投资5盒币.jpg", 1, 1, "继续投资按钮", true);
                    if (continuedInvestment) {
                        Logger.info("找到继续投资按钮，投资明日打卡活动");
                        sleep(DELAYS.PAGE_LOAD);  // 等待报名结果
                        
                        // 检查是否报名成功
                        var signUpSuccess = className("android.widget.TextView").depth("15").text("报名成功").findOne(DELAYS.PAGE_LOAD);
                        if (signUpSuccess) {
                            Logger.info("继续报名成功，明天可以打卡");
                            return true;
                        } else {
                            Logger.warn("没有找到报名成功提示");
                            return false;
                        }
                    } else {
                        Logger.info("没有找到继续投资按钮");
                    }
                }
            } else {
                Logger.info("没有找到打卡按钮，可能已经打卡过了");
            }
        } else {
            Logger.info("没有找到参与按钮");
        }
    } else {
        Logger.info("没有找到搜索框");
    }

    Logger.info("任务状态未知，可能已完成或出现异常");
    return false;  // 返回false表示任务未完成
}

/**
 * 每天在游戏盒里玩游戏
 * @returns {boolean} 是否成功完成任务
 */
function PlayGame() {
    Logger.info("执行任务: 每天在游戏盒里玩游戏");
    
    // 打开游戏盒游戏页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.battlereport.BattleReportListActivity",
        root: true,
    });
    Logger.info("打开游戏盒游戏页面");
    sleep(DELAYS.PAGE_LOAD);
    
    // 点击已安装的标签
    var alreadyInstalled = text("已安装")
        .id("tv_tab_title")
        .depth("10")
        .className("android.widget.TextView")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!alreadyInstalled) {
        Logger.error("未找到已安装标签");
        return false;
    }
    
    Logger.info("找到已安装标签");
    if (!clickBounds(alreadyInstalled)) {
        Logger.error("点击已安装标签失败");
        return false;
    }
    Logger.info("已点击已安装标签");
    sleep(DELAYS.ANIMATION);
    
    // 尝试启动游戏的最大次数
    for (var j = 1; j < 4; j++) {
        // 查找"开始玩"按钮
        var startGame = text("开始玩")
            .id("downloadTv")
            .depth("18")
            .className("android.widget.TextView")
            .findOne(DELAYS.PAGE_LOAD);
            
        if (startGame) {
            Logger.info("找到可直接启动的游戏");
            clickBounds(startGame);
            sleep(DELAYS.ANIMATION);
            
            // 处理权限请求
            var denyButton = text("拒绝").findOne(DELAYS.PAGE_LOAD);
            if (denyButton) {
                denyButton.click();
                Logger.info("已拒绝启动游戏的请求");
                return true;
            }
            
        } else {
            Logger.info("未找到可直接启动的游戏，尝试更新");
            
            // 查找需要更新的游戏
            var updateGame = text("更新")
                .id("downloadTv")
                .depth("18")
                .className("android.widget.TextView")
                .findOne(DELAYS.PAGE_LOAD);
                
            if (updateGame) {
                Logger.info("找到需要更新的游戏");
                clickBounds(updateGame);
                
                // 等待更新完成
                for (var i = 1; i < 12; i++) {
                    var loading = id("downloadTv")
                        .depth("18")
                        .className("android.widget.TextView")
                        .findOne(DELAYS.PAGE_LOAD);
                        
                    Logger.info("更新进度: " + loading.text());
                    
                    // 检查是否可以安装
                    var install = text("安装")
                        .id("downloadTv")
                        .depth("18")
                        .className("android.widget.TextView")
                        .findOne(DELAYS.PAGE_LOAD);
                        
                    if (install) {
                        Logger.info("准备安装游戏");
                        clickBounds(install);
                        sleep(DELAYS.PAGE_LOAD);
                        
                        // 处理继续更新弹窗
                        var continueUpdate = text("继续更新").findOne(DELAYS.PAGE_LOAD);
                        if (continueUpdate && continueUpdate.click()) {
                            Logger.info("点击继续更新");
                            sleep(DELAYS.VERY_LONG_WAIT);
                            break;
                        }
                    }
                    sleep(DELAYS.ANIMATION);
                }
            } else {
                Logger.error("未找到可更新的游戏");
                return false;
            }
        }
        
        sleep(DELAYS.ANIMATION);
    }
    
    Logger.error("多次尝试后仍未能完成游戏启动任务");
    return false;
}

/**
 * 任务：分享活动中心任意活动
 * @returns {boolean} 是否成功完成任务
 */
function ShareActivity() {
    Logger.info("执行任务: 分享活动中心任意活动");
    
    // 打开活动中心页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.module.welfare.activity.center.ActivityCenterActivity",
        root: true,
    });
    Logger.info("打开活动中心页面");
    sleep(DELAYS.PAGE_LOAD);

    // 点击第一个活动
    var activity = depth("20")
        .clickable(true)
        .className("android.view.ViewGroup")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!activity) {
        Logger.error("未找到可点击的活动");
        return false;
    }
    
    Logger.info("找到活动，准备点击");
    clickBounds(activity);
    sleep(DELAYS.VERY_LONG_WAIT); // 等待活动页面加载
    
    // 查找并点击分享按钮
    var shareButton = id("ib_share")
        .depth("9")
        .clickable(true)
        .className("android.widget.ImageButton")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!shareButton) {
        Logger.error("未找到分享按钮");
        return false;
    }
    
    Logger.info("找到分享按钮，准备点击");
    clickBounds(shareButton);
    sleep(DELAYS.ANIMATION);
    
    // 查找并点击"动态"分享选项
    var shareToDynamic = text("动态")
        .id("tv_share_item")
        .depth("6")
        .className("android.widget.TextView")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!shareToDynamic) {
        Logger.error("未找到动态分享选项");
        return false;
    }
    
    Logger.info("找到动态分享选项，准备点击");
    clickBounds(shareToDynamic);
    sleep(DELAYS.ANIMATION);
    
    // 查找并填写分享内容
    var editText = id("zone_edit")
        .depth("13")
        .clickable(true)
        .className("android.widget.EditText")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!editText) {
        Logger.error("未找到分享内容输入框");
        return false;
    }
    
    Logger.info("找到输入框，填写分享内容");
    editText.setText("分享活动");
    sleep(DELAYS.ANIMATION);
    
    // 查找并点击发布按钮
    var publishButton = text("发布")
        .id("menu_title")
        .depth("10")
        .clickable(true)
        .className("android.widget.Button")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!publishButton) {
        Logger.error("未找到发布按钮");
        return false;
    }
    
    Logger.info("找到发布按钮，准备发布");
    clickBounds(publishButton);
    sleep(DELAYS.ANIMATION);
    
    Logger.info("分享活动任务完成");
    return true;
}

/**
 * 任务：浏览预约专区
 * @returns {boolean} 是否成功完成任务
 */
function BrowseReservationArea() {
    Logger.info("执行任务: 浏览预约专区");
    
    try {
        // 直接点击任务名称
        click("浏览预约专区");
        
        // 等待足够长的时间完成浏览
        sleep(DELAYS.VERY_LONG_WAIT);
        
        Logger.info("浏览预约专区完成");
        return true;
        
    } catch (error) {
        Logger.error("浏览预约专区时出错", error);
        return false;
    }
}

/**
 * 执行指定任务
 * @param {Object} task 任务对象，包含name和desc属性
 * @returns {boolean} 是否成功完成任务
 */
function ExecuteTask(task) {
    Logger.info(`准备执行任务: ${task.name}`);
    
    try {
        switch (task.name) {
            case "每天在游戏盒里玩游戏":
                return PlayGame();
                
            case "挑选心仪的福利并领取":
                return SelectiveBenefits();
                
            case "分享活动中心任意活动":
                return ShareActivity();
                
            case "在论坛加入页中加入1个论坛":
                return JoinForum();
                
            case "点赞一条动态评论":
                return LikeComment();
                
            case "查看推荐页任意3个帖子":
                return Browse3Posts();
                
            case "关注一个感兴趣的人":
                return FocusOnNewPeople();
                
            case "浏览预约专区":
                return BrowseReservationArea();
                
            case "观看任一“直播”":
                return WatchLive();
                
            case "启动任意一款小游戏":
                return LaunchMiniGame();
                
            case "浏览每日新游":
                Logger.info("执行任务: 浏览每日新游");
                click("浏览每日新游");
                sleep(DELAYS.VERY_LONG_WAIT); // 等待13秒
                Logger.info("浏览每日新游，任务完成");
                return true;
                
            default:
                Logger.warn(`未知任务: ${task.name}`);
                Logger.info(`任务描述: ${task.desc}`);  // 添加任务描述输出以便调试
                return false;
        }
    } catch (error) {
        Logger.error(`执行任务 ${task.name} 时出错`, error);
        return false;
    }
}

/**
 * 任务：在论坛加入页中加入1个论坛
 * @returns {boolean} 是否成功完成任务
 */
function JoinForum() {
    Logger.info("执行任务: 在论坛加入页中加入1个论坛");
    
    // 打开论坛推荐页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.gamehub.GameHubSearchActivity",
        root: true,
    });
    Logger.info("打开论坛推荐页面");
    sleep(DELAYS.PAGE_LOAD);

    // 查找并点击关注按钮
    var followButton = text("关注")
        .depth("18")
        .clickable(true)
        .className("android.widget.TextView")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!followButton) {
        Logger.error("未找到可关注的论坛");
        return false;
    }
    
    Logger.info("找到论坛关注按钮，准备点击");
    clickBounds(followButton);
    sleep(DELAYS.ANIMATION);
    
    // 验证关注是否成功，并取消关注
    var followedButton = text("已关注")
        .depth("18")
        .clickable(true)
        .className("android.widget.TextView")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!followedButton) {
        Logger.error("关注论坛失败");
        return false;
    }
    
    Logger.info("关注成功，准备取消关注");
    clickBounds(followedButton);
    sleep(DELAYS.ANIMATION);
    
    Logger.info("论坛关注任务完成");
    return true;
}

/**
 * 获取每日任务列表
 * @returns {Array<Object>} 返回需要完成的任务列表，每个任务包含name和desc属性
 */
function GetTaskList() {
    Logger.info("开始获取每日任务列表");
    
    // 先解锁每日任务
    if (!UnlockDailyTasks()) {
        Logger.error("解锁每日任务失败，无法获取任务列表");
        return [];
    }
    Logger.info("每日任务解锁成功，准备获取任务列表");
    sleep(DELAYS.ANIMATION);
    
    // 点击更多任务按钮
    var moreTask = text("更多任务").findOne(DELAYS.PAGE_LOAD);
    if (moreTask) {
        Logger.info("点击更多任务按钮，获取全部任务");
        clickBounds(moreTask);
    } else {
        Logger.info("更多任务按钮已经成功点击或者没有找到");
    }
    sleep(DELAYS.ANIMATION);
    
    // 2. 获取任务列表容器
    var taskListContainer = className("android.support.v7.widget.RecyclerView")
        .id("grid_view_layout")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (!taskListContainer) {
        Logger.error("未找到任务列表容器");
        return [];
    }
    
    // 3. 获取所有未完成的任务
    let tasksToComplete = [];
    let taskItems = taskListContainer.children();
    
    for (let taskItem of taskItems) {
        // 获取任务信息
        let taskName = taskItem.findOne(className("android.widget.TextView").id("tv_task_name"));
        let taskDesc = taskItem.findOne(className("android.widget.TextView").id("tv_task_desc"));
        
        // 检查任务状态
        let isUnfinished = taskItem.findOne(className("android.widget.TextView")
            .id("tv_task_status_goto_finish")
            .text("去完成")) ||
            taskItem.findOne(className("android.widget.TextView")
            .id("tv_task_status_unfinish")
            .text("未完成"));
            
        if (isUnfinished && taskName) {
            tasksToComplete.push({
                name: taskName.text(),
                desc: taskDesc ? taskDesc.text() : "无描述"
            });
        }
    }
    
    // 4. 输出任务信息
    if (tasksToComplete.length > 0) {
        Logger.info("找到以下未完成的任务：");
        tasksToComplete.forEach(task => {
            Logger.info(`- ${task.name}: ${task.desc}`);
        });
    } else {
        Logger.info("所有任务已完成");
    }
    
    return tasksToComplete;
}

/**
 * 测试滑块验证----------------------------------------------------未完成
 */
function testSliderVerification() {
    Logger.info("开始测试滑块验证功能");
    
    try {
        // 等待用户手动打开有滑块验证的页面
        toast("请在1秒内打开包含滑块验证的页面");
        sleep(1000);
        
        // 尝试处理滑块验证
        const result = handleSliderVerification();
        
        if (result) {
            Logger.info("滑块验证测试成功");
            toast("滑块验证成功");
        } else {
            Logger.error("滑块验证测试失败");
            toast("滑块验证失败");
        }
        
        
        // 输出详细的验证过程信息
        Logger.info("测试完成，按音量上键退出测试");
        threads.start(function() {
            events.observeKey();
            events.onKeyDown("volume_up", function(event){
                Logger.info("测试结束");
                exit();
            });
        });
        
    } catch (error) {
        Logger.error("测试过程出错", error);
        toast("测试出错：" + error.message);
    }
}

/**
 * 返回主页面
 */
function ReturnToHomePage() {
    Logger.info("返回主页面");
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.ApplicationActivity",
        root: true,
    });
    sleep(DELAYS.PAGE_LOAD);
}

/**
 * 执行任务前的准备工作
 * @param {string} taskName - 任务名称
 */
function PrepareForTask(taskName) {
    Logger.info(`准备执行任务: ${taskName}`);
    ReturnToHomePage();
}

/**
 * 任务：关注一个感兴趣的人
 * @returns {boolean} 是否成功完成任务
 */
function FocusOnNewPeople() {
    Logger.info("执行任务: 关注一个感兴趣的人");
    
    // 打开主页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.ApplicationActivity",
        root: true,
    });
    Logger.info("打开主页面");
    sleep(DELAYS.PAGE_LOAD);

    // 检查并进入社区页面
    if (!CheckAndClickCommunityTab()) {
        return false;
    }
    sleep(DELAYS.ANIMATION);

    // 确保在推荐页面
    var communityRecommendation = finding(imagesPath + "社区-推荐.jpg", 1, 1, "检查是否在推荐页面", true);
    if (!communityRecommendation) {
        Logger.error("未能进入社区推荐页面");
        return false;
    }
    Logger.info("已在社区推荐页面");
    sleep(DELAYS.ANIMATION);

    // 查找并点击热门话题
    var hotTopic = finding(imagesPath + "社区-热门话题icon.jpg", 1, 1, "查找热门话题图标", true);
    if (!hotTopic) {
        Logger.error("未找到热门话题图标");
        return false;
    }
    Logger.info("已点击热门话题");
    sleep(DELAYS.PAGE_LOAD);

    // 尝试查找用户头像的最大次数
    const MAX_SCROLL_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_SCROLL_ATTEMPTS; attempt++) {
        // 查找用户头像
        var userIcon = className("android.widget.ImageView")
            .id("uiv_circle_view")
            .depth("19")
            .clickable(true)
            .findOne(DELAYS.PAGE_LOAD);

        if (userIcon) {
            Logger.info("找到用户头像，准备点击");
            if (!clickBounds(userIcon)) {
                Logger.error("点击用户头像失败");
                continue;
            }
            sleep(DELAYS.PAGE_LOAD);

            // 查找并点击关注按钮
            var followButton = className("android.widget.TextView")
                .depth("13")
                .id("btn_follow")
                .clickable(true)
                .findOne(DELAYS.PAGE_LOAD);

            if (followButton) {
                Logger.info("找到关注按钮，准备关注");
                if (clickBounds(followButton)) {
                    sleep(DELAYS.ANIMATION);
                    
                    // 验证是否成功关注（按钮文字变为"已关注"）
                    var followedButton = className("android.widget.TextView")
                        .depth("13")
                        .id("btn_follow")
                        .text("已关注")
                        .findOne(DELAYS.PAGE_LOAD);
                        
                    if (followedButton) {
                        Logger.info("关注成功，准备取消关注");
                        // 取消关注
                        if (clickBounds(followedButton)) {
                            sleep(DELAYS.ANIMATION);
                            Logger.info("关注任务完成");
                            return true;
                        }
                    }
                }
            } else {
                Logger.warn("未找到关注按钮，返回列表");
                back();
                sleep(DELAYS.ANIMATION);
            }
        }

        // 如果没找到合适的用户或关注失败，上滑继续查找
        Logger.info(`第 ${attempt} 次滑动查找新用户`);
        swipe(474, 2133, 474, 314, 1000);
        sleep(DELAYS.ANIMATION);
    }

    Logger.error("多次尝试后未能完成关注任务");
    return false;
}

/**
 * 任务：启动任意一款小游戏
 * @returns {boolean} 是否成功完成任务
 */
function LaunchMiniGame() {
    Logger.info("执行任务: 启动任意一款小游戏");
    
    // 打开小游戏页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.minigame.MiniGameActivity",
        root: true,
    });
    Logger.info("打开小游戏页面");
    sleep(DELAYS.PAGE_LOAD);

    // 找到小游戏列表
    var recyclerView = className("android.support.v7.widget.RecyclerView")
        .depth("14")
        .id("rlv")
        .findOne(DELAYS.VERY_LONG_WAIT);

    if (!recyclerView) {
        Logger.error("未找到小游戏列表");
        return false;
    }

    // 获取所有子控件
    var taskItems = recyclerView.children();
    if (taskItems.length === 0) {
        Logger.error("小游戏列表为空");
        return false;
    }

    // 点击第一个小游戏
    var firstGame = taskItems[0];
    Logger.info("找到小游戏，准备启动");
    firstGame.click();
    sleep(DELAYS.SHORT_WAIT);

    // 退出游戏
    back();
    sleep(DELAYS.ANIMATION);
    
    // 处理退出请求
    exitGame();

    Logger.info("小游戏启动任务完成");
    return true;
}

/**
 * 处理权限请求弹窗
 */
function handlePermissionRequest() {
    // 查找并点击拒绝按钮
    var denyButton = text("拒绝").findOne(DELAYS.PAGE_LOAD);
    if (denyButton) {
        clickBounds(denyButton);
        Logger.info("已拒绝权限请求");
        sleep(DELAYS.ANIMATION);
    }
    
    // 查找并点击不允许按钮（某些设备上的变体）
    var notAllowButton = text("不允许").findOne(DELAYS.PAGE_LOAD);
    if (notAllowButton) {
        clickBounds(notAllowButton);
        Logger.info("已拒绝权限请求（不允许）");
        sleep(DELAYS.ANIMATION);
    }
}

/**
 * 尝试退出游戏
 * @returns {boolean} 是否成功退出
 */
function exitGame() {
    // 尝试点击退出按钮
    var exitButton = className("android.widget.Button")
        .text("退出")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (exitButton && clickBounds(exitButton)) {
        Logger.info("通过退出按钮退出游戏");
        sleep(DELAYS.ANIMATION);
        return true;
    }
    
    // 尝试点击返回箭头
    var backArrow = className("android.widget.ImageButton")
        .desc("转到上一层级")
        .findOne(DELAYS.PAGE_LOAD);
        
    if (backArrow && clickBounds(backArrow)) {
        Logger.info("通过返回箭头退出游戏");
        sleep(DELAYS.ANIMATION);
        return true;
    }
    
    // 使用返回键
    Logger.info("尝试使用返回键退出游戏");
    back();
    sleep(DELAYS.ANIMATION);
    
    // 处理可能的确认退出弹窗
    var confirmExit = text("退出").findOne(DELAYS.PAGE_LOAD);
    if (confirmExit) {
        clickBounds(confirmExit);
        Logger.info("确认退出游戏");
        sleep(DELAYS.ANIMATION);
    }
    
    return true;
}

/**
 * 任务：查看推荐页任意3个帖子
 * @returns {boolean} 是否成功完成任务
 */
function Browse3Posts() {
    Logger.info("执行任务: 查看推荐页任意3个帖子");
    
    // 打开主页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.ApplicationActivity",
        root: true,
    });
    Logger.info("打开主页面");
    sleep(DELAYS.PAGE_LOAD);

    // 检查并进入社区页面
    if (!CheckAndClickCommunityTab()) {
        return false;
    }
    sleep(DELAYS.ANIMATION);

    // 确保在推荐页面
    var communityRecommendation = finding(imagesPath + "社区-推荐.jpg", 1, 1, "检查是否在推荐页面", true);
    if (!communityRecommendation) {
        Logger.error("未能进入社区推荐页面");
        return false;
    }
    Logger.info("已在社区推荐页面");
    sleep(DELAYS.ANIMATION);

    // 查找并点击热门话题
    var hotTopic = finding(imagesPath + "社区-热门话题icon.jpg", 1, 1, "查找热门话题图标", true);
    if (!hotTopic) {
        Logger.error("未找到热门话题图标");
        return false;
    }
    Logger.info("已点击热门话题");
    sleep(DELAYS.PAGE_LOAD);

    // 浏览帖子计数
    var viewedPosts = 0;
    const MAX_SCROLL_ATTEMPTS = 10; // 最大滑动次数
    var scrollAttempts = 0;

    while (viewedPosts < 3 && scrollAttempts < MAX_SCROLL_ATTEMPTS) {
        // 查找帖子评论图标
        var commentIcon = className("android.widget.TextView")
            .depth("18")
            .id("tv_reply_cnt")
            .findOne(DELAYS.PAGE_LOAD);

        if (commentIcon) {
            Logger.info(`准备查看第 ${viewedPosts + 1} 个帖子`);
            
            // 尝试点击评论图标
            if (clickBounds(commentIcon)) {
                viewedPosts++;
                Logger.info(`成功进入第 ${viewedPosts} 个帖子`);
                sleep(DELAYS.PAGE_LOAD);

                // 在帖子内滑动浏览
                for (let i = 0; i < 2; i++) {
                    swipe(474, 2245, 474, 314, 1000);
                    sleep(DELAYS.ANIMATION);
                }

                // 返回帖子列表
                back();
                Logger.info("返回帖子列表");
                sleep(DELAYS.ANIMATION);

                // 如果已经看完3个帖子，结束任务
                if (viewedPosts >= 3) {
                    Logger.info("已完成3个帖子的浏览");
                    return true;
                }
            } else {
                Logger.warn("点击评论图标失败，尝试下一个");
            }
        }

        // 上滑寻找新的帖子
        Logger.info(`第 ${scrollAttempts + 1} 次滑动查找新帖子`);
        swipe(474, 2245, 474, 314, 1000);
        sleep(DELAYS.ANIMATION);
        scrollAttempts++;
    }

    // 检查任务是否完成
    if (viewedPosts >= 3) {
        Logger.info("浏览帖子任务完成");
        return true;
    } else {
        Logger.error(`仅浏览了 ${viewedPosts} 个帖子，任务未完成`);
        return false;
    }
}

/**
 * 获取当前使用的点赞图标
 * @returns {Object} 包含未选中和已选中图标的文件名
 */
function getLikeIcons() {
    // 定义所有可能的点赞图标
    const LIKE_ICONS = {
        default: {
            unselected: "点赞未选中(爱心).jpg",
            selected: "点赞选中(爱心).jpg",
            desc: "爱心"
        },
        spring_festival: {
            unselected: "点赞未选中(过年期间).jpg",
            selected: "点赞选中(过年期间).jpg",
            desc: "过年期间"
        },
        heart: {
            unselected: "点赞未选中(爱心).jpg",
            selected: "点赞选中(爱心).jpg",
            desc: "爱心"
        }
    };
    
    // 返回所有可能的图标组合
    return [LIKE_ICONS.heart, LIKE_ICONS.default];
}

/**
 * 查找任意一个未选中的点赞图标
 * @param {number} offsetX X轴偏移
 * @param {number} offsetY Y轴偏移
 * @param {string} logPrefix 日志前缀
 * @returns {boolean} 是否找到点赞图标
 */
function findAnyUnselectedLikeIcon(offsetX, offsetY, logPrefix) {
    const icons = getLikeIcons();
    
    for (let icon of icons) {
        let found = finding(imagesPath + icon.unselected, offsetX, offsetY, 
            `${logPrefix}--查找${icon.desc}点赞图标`, true);
        if (found) return true;
    }
    return false;
}

/**
 * 查找任意一个已选中的点赞图标
 * @param {number} offsetX X轴偏移
 * @param {number} offsetY Y轴偏移
 * @param {string} logPrefix 日志前缀
 * @returns {boolean} 是否找到点赞图标
 */
function findAnySelectedLikeIcon(offsetX, offsetY, logPrefix) {
    const icons = getLikeIcons();
    
    for (let icon of icons) {
        let found = finding(imagesPath + icon.selected, offsetX, offsetY, 
            `${logPrefix}--查找已点赞的${icon.desc}图标`);
        if (found) return true;
    }
    return false;
}

/**
 * 任务：点赞一条动态评论
 * @returns {boolean} 是否成功完成任务
 */
function LikeComment() {
    Logger.info("执行任务: 点赞一条动态评论");
    
    // 打开主页面
    app.startActivity({
        action: "android.intent.action.MAIN",
        packageName: "com.m4399.gamecenter",
        className: "com.m4399.gamecenter.plugin.main.controllers.ApplicationActivity",
        root: true,
    });
    Logger.info("打开主页面");
    sleep(DELAYS.PAGE_LOAD);

    // 检查并进入社区页面
    if (!CheckAndClickCommunityTab()) {
        return false;
    }
    sleep(DELAYS.ANIMATION);

    // 进入动态页面
    var communityDynamics = finding(imagesPath + "社区-动态.jpg", 1, 1, "查找福利--动态标签",true);
    if (!communityDynamics) {
        Logger.error("未找到动态标签");
        return false;
    }
    Logger.info("已进入动态页面");
    sleep(DELAYS.PAGE_LOAD); // 增加等待时间，确保页面加载完成

    // 尝试多次查找可点赞的帖子
    const MAX_POST_ATTEMPTS = 5;  // 最大尝试帖子数
    const MAX_SCROLL_IN_POST = 3; // 在帖子内最大滑动次数
    
    for (let postAttempt = 1; postAttempt <= MAX_POST_ATTEMPTS; postAttempt++) {
        // 查找并进入帖子
        if (findAnyUnselectedLikeIcon(1, -300, "准备进入帖子--")) {
            Logger.info(`进入第 ${postAttempt} 个帖子`);
            sleep(DELAYS.PAGE_LOAD);
            
            // 在帖子内查找点赞按钮
            for (var scrollCount = 0; scrollCount < MAX_SCROLL_IN_POST; scrollCount++) {
                if (findAnyUnselectedLikeIcon(1, 1, "帖子中--")) {
                    Logger.info("找到点赞按钮并点击");
                    sleep(DELAYS.ANIMATION);
                    
                    // 验证点赞是否成功
                    if (findAnySelectedLikeIcon(1, 1, "验证点赞--")) {
                        Logger.info("点赞成功");
                        return true;
                    }
                }
                
                if (scrollCount < MAX_SCROLL_IN_POST - 1) {
                    Logger.info(`帖子内第 ${scrollCount + 1} 次滑动`);
                    swipe(474, 2133, 474, 314, 1000);
                    sleep(DELAYS.ANIMATION);
                }
            }
            
            // 如果在当前帖子内滑动多次后仍未找到可点赞内容，返回上一页
            Logger.info("当前帖子未找到可点赞内容，返回选择新帖子");
            back();
            sleep(DELAYS.ANIMATION);
        }
        
        // 在动态列表页面上滑寻找新的帖子
        Logger.info(`第 ${postAttempt} 次滑动查找新帖子`);
        swipe(474, 2133, 474, 314, 1000);
        sleep(DELAYS.PAGE_LOAD);
    }

    Logger.error("多次尝试后未能完成点赞任务");
    return false;
}

/**
 * 任务：挑选心仪的福利并领取
 * @returns {boolean} 是否成功完成任务
 */
function SelectiveBenefits() {
    Logger.info("执行任务: 挑选心仪的福利");
    
    try {
        // 打开主页面
        app.startActivity({
            action: "android.intent.action.MAIN",
            packageName: "com.m4399.gamecenter",
            className: "com.m4399.gamecenter.module.welfare.shop.home.ShopHomeActivity",
            root: true,
        });
        Logger.info("打开福利商店页面");
        sleep(DELAYS.PAGE_LOAD);

        // 点击表情包标签
        var emojiTab = className("android.widget.TextView")
            .depth("17")
            .id("tv_name")
            .text("表情包")
            .findOne(DELAYS.PAGE_LOAD);
            
        if (!emojiTab || !clickBounds(emojiTab)) {
            Logger.error("未找到或无法点击表情包标签");
            return false;
        }
        Logger.info("已进入表情包分类");
        sleep(DELAYS.ANIMATION);

        // 滑动查找免费福利
        swipe(518, 2000, 518, 360, 1000);
        sleep(DELAYS.ANIMATION);

        // 定义搜索区域（上部和下部留出安全边距）
        const SCREEN_WIDTH = device.width;
        const SCREEN_HEIGHT = device.height;
        const SEARCH_AREA = {
            top: Math.floor(SCREEN_HEIGHT * 0.15),    // 顶部15%  360
            bottom: Math.floor(SCREEN_HEIGHT * 0.85), // 底部15%  2040
            left: 0,
            right: SCREEN_WIDTH
        };

        // 查找免费福利
        const MAX_ATTEMPTS = 30;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            // 在指定区域内查找免费福利
            let freeFulis = text("免费")
                .id("tv_free")
                .boundsInside(SEARCH_AREA.left, SEARCH_AREA.top, 
                            SEARCH_AREA.right, SEARCH_AREA.bottom)
                .find();
            
            Logger.info(`当前搜索区域内找到 ${freeFulis.length} 个免费福利`);
            
            // 处理找到的免费福利
            for (let fuli of freeFulis) {
                // 获取父容器
                let parent = fuli.parent();
                if (!parent) continue;
                
                // 尝试点击父容器
                if (clickBounds(parent)) {
                    sleep(DELAYS.ANIMATION);
                    
                    // 检查是否可以免费兑换
                    var freeButton = className("android.widget.TextView")
                        .clickable(true)
                        .depth("12")
                        .id("btn_download")
                        .text("免费")
                        .findOne(DELAYS.PAGE_LOAD);

                    if (freeButton) {
                        Logger.info("找到可兑换的免费福利");
                        if (clickBounds(freeButton)) {
                            sleep(DELAYS.PAGE_LOAD);
                            
                            // 确认兑换
                            var redeemButton = className("android.widget.TextView")
                                .depth("10")
                                .id("rl_exchange_button_container")
                                .text("免费兑换")
                                .findOne(DELAYS.PAGE_LOAD);
                                
                            if (redeemButton && clickBounds(redeemButton)) {
                                Logger.info("兑换成功");
                                return true;
                            }
                        }
                    }
                    
                    Logger.warn("当前福利不可兑换，尝试下一个");
                    back();
                    sleep(DELAYS.ANIMATION);
                }
            }
            
            // 如果当前页面没有找到可兑换的福利，继续滑动
            if (attempt < MAX_ATTEMPTS) {
                Logger.info(`第 ${attempt} 次滑动查找新的免费福利`);
                swipe(620, 2000, 620, 360, 1000); //大概滑动3个图框的距离
                sleep(DELAYS.ANIMATION);
            }
        }

        Logger.warn("未找到合适的免费福利");
        return false;
        
    } catch (error) {
        Logger.error("挑选福利任务出错", error);
        return false;
    }
}

/**
 * 任务：观看任一"直播"
 * @returns {boolean} 是否成功完成任务
 */
function WatchLive() {
    Logger.info("执行任务: 观看任一“直播”");
    
    try {
        // 打开主页面并进入社区页面
        ReturnToHomePage();
        sleep(DELAYS.ANIMATION);

        // 检查并进入社区页面
        if (!CheckAndClickCommunityTab()) {
            return false;
        }
        sleep(DELAYS.ANIMATION);

        // 查找并点击直播标签
        var watchLive = text("直播")
            .id("tv_tab_title")
            .depth("14")
            .className("android.widget.TextView")
            .findOne(DELAYS.PAGE_LOAD);
            
        if (watchLive) {
            Logger.info("找到直播标签，准备点击");
            if (clickBounds(watchLive)) {
                Logger.info("点击直播标签成功");

                // 查找精彩推荐并点击直播
                var userWatchLive = finding(imagesPath + "社区-直播-精彩推荐.jpg", 1, -150, "点击精彩推荐，向下偏移点直播",true);
                if (userWatchLive) {
                    Logger.info("进入直播成功");
                    sleep(DELAYS.ANIMATION);
                    return true;
                }
            } else {
                Logger.error("点击直播标签失败");
                return false;
            }
        } else {
            Logger.error("未找到直播标签");
            return false;
        }
        
        return false;
    } catch (error) {
        Logger.error("观看直播任务出错", error);
        return false;
    }
}

// 主函数
function main() {
    Logger.taskStart('4399自动盒币');
    
    try {
        // 初始化
        checkAndRequestPermissions();
        
        /* // 1. 赛尔号页游签到活动
        Logger.taskStart('赛尔号页游签到');
        const saiErResult = SaiErHaoQianDao();
        Logger.taskEnd('赛尔号页游签到', saiErResult);
        sleep(DELAYS.TASK_INTERVAL);

        // 2. 4399早起打卡活动
        Logger.taskStart('早起打卡');
        const getUpResult = GetUp();
        Logger.taskEnd('早起打卡', getUpResult);
        sleep(DELAYS.TASK_INTERVAL); */
        
        /* // 3. 打开每日任务页面并完成基础任务
        Logger.taskStart('每日任务页面初始化');
        if (!OpenDailyTaskPage()) {
            Logger.error("无法打开或初始化每日任务页面，脚本终止");
            return;
        }
        Logger.taskEnd('每日任务页面初始化', true);
        sleep(DELAYS.TASK_INTERVAL);

        // 4. 执行每日任务中的签到
        Logger.taskStart('每日签到');
        const signInResult = DailySignIn();
        if (!signInResult) {
            Logger.warn("每日签到失败，但继续执行其他任务");
        }
        Logger.taskEnd('每日签到', signInResult);
        sleep(DELAYS.TASK_INTERVAL); */

        // 5. 执行每日任务列表（GetTaskList 内部会处理解锁）
        Logger.taskStart('获取每日任务');
        const tasksToComplete = GetTaskList();
        Logger.taskEnd('获取每日任务', true);
        
        if (tasksToComplete.length > 0) {
            let completedTasks = 0;
            for (let task of tasksToComplete) {
                Logger.taskStart(task.name);
                const result = ExecuteTask(task);
                Logger.taskEnd(task.name, result);
                if (result) completedTasks++;
                
                // 每个任务完成后返回任务页面
                if (!OpenDailyTaskPage()) {
                    Logger.warn("无法返回每日任务页面");
                }
                sleep(DELAYS.TASK_INTERVAL);
            }
            
            // 输出任务完成统计
            Logger.info(`每日任务完成情况: ${completedTasks}/${tasksToComplete.length}`);
        } else {
            Logger.info("没有需要完成的任务");
        }

        // 最终检查
        if (!OpenDailyTaskPage()) {
            Logger.warn("无法返回每日任务页面进行最终检查");
        }

        Logger.taskEnd('4399自动盒币', true);
        
    } catch (error) {
        Logger.error('执行主程序时出错', error);
        Logger.taskEnd('4399自动盒币', false);
    } finally {
        Logger.info("脚本执行完毕");
    }
}

// 添加检查权限的函数
function checkAndRequestPermissions() {
    if (!requestScreenCapture()) {
        toast("请求截图权限失败");
        exit();
    }
}

// 如果要运行测试，注释掉 main() 调用，改为：
//testSliderVerification();

SelectiveBenefits();