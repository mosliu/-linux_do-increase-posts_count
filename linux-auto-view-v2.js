// 创建一个日志输出区域
(function () {
    // 只有未初始化的情况下才会执行下面的代码
    if (window.log) {
        return;
    }
    const debugLogDiv = document.createElement('div');
    debugLogDiv.style.position = 'fixed';
    debugLogDiv.style.top = '65px';
    debugLogDiv.style.left = '0';
    debugLogDiv.style.background = 'rgba(0, 0, 0, 0.7)';
    debugLogDiv.style.color = 'white';
    debugLogDiv.style.padding = '10px';
    debugLogDiv.style.minWidth = '300px';
    debugLogDiv.style.maxWidth = '60%';
    debugLogDiv.style.maxHeight = '50%';
    debugLogDiv.style.overflowY = 'auto';
    debugLogDiv.style.fontSize = '12px';
    debugLogDiv.style.zIndex = '9999';
    document.body.appendChild(debugLogDiv);

    // 定义 log.printf 函数
    window.log = {
        printf: function (color, format, ...args) {
            let message = format;
            args.forEach((arg, index) => {
                message = message.replace(`%s`, arg);
            });
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            logEntry.style.color = color;
            debugLogDiv.appendChild(logEntry);

            // 滚动到最新日志
            debugLogDiv.scrollTop = debugLogDiv.scrollHeight;
        },
        debug: function (format, ...args) {
            this.printf('grey', format, ...args);
        },
        info: function (format, ...args) {
            this.printf('white', format, ...args);
        }
    };
})();

// 代码正文
((maxTopicsLength) => {
    // 获取话题列表
    function getTopics() {
        return new Promise((resolve, reject) => {
            let topicListViewNum = 0;

            function scrollToNextTopic() {
                const topicItemList = document.querySelectorAll('.topic-list-body tr.topic-list-item:not(.pinned) a.raw-topic-link');
                log.debug("scrollToNextTopic.length: %s", topicItemList.length);

                // 如果话题列表为空或者已经达到最大话题数量则返回
                if (topicItemList.length >= maxTopicsLength) {
                    resolve(topicItemList);
                    return;
                }

                // 当前要滑动到的话题
                const topic = topicItemList[topicListViewNum];
                log.debug("scrollToNextTopic.topic: %s", topic);

                // 没有新话题可以滑动时获取最新的列表
                if (!topic) {
                    setTimeout(scrollToNextTopic, 3000);
                    return;
                }

                // 3秒后滑动到下一个话题
                setTimeout(() => {
                    log.debug("scrollIntoView: %s", topicListViewNum);
                    topic.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    topicListViewNum += 5;
                    scrollToNextTopic();
                }, 500);
            }

            scrollToNextTopic();
        });
    }

    // 话题列表
    let topics = [];

    // 进入话题
    function enterTopic() {
        const topic = document.querySelector('.topic-list-body tr.topic-list-item a.raw-topic-link, .page-not-found-topics .not-found-topic a');
        topic.href = topics.shift();

        log.info('将要阅读帖子: %s', topic.href);

        // 然后点击它
        topic.click();

        // 延迟5秒后阅读帖子
        setTimeout(() => {
            readPosts().then(() => {
                // 随机1-4秒后进入下一个话题
                const randomDelay = Math.floor(Math.random() * 3000) + 1000; // 1000-4000ms
                log.info("延迟 %s 毫秒后阅读新帖子", randomDelay);
                setTimeout(enterTopic, randomDelay);
            });
        }, 5000);
    }

    // 阅读帖子
    function readPosts() {
        return new Promise((resolve, reject) => {
            // 如果没有回复列表就等加载完成
            const postListDom = document.querySelector('.post-stream');
            if (!postListDom) {
                // 检查是不是 404
                const is_404 = document.querySelector('.page-not-found-topics .not-found-topic a');
                if (is_404) {
                    log.info("404 页面, 开始下一个");
                    resolve();
                    return;
                }

                log.info("没有回复列表, 5秒后重新获取");
                setTimeout(() => {
                    readPosts().then(resolve);
                }, 5000);
                return;
            }

            // 获取第一个帖子并滚动一次
            const firstPost = document.querySelector('.post-stream .topic-post');
            if (firstPost) {
                log.info("滚动到第一个帖子");
                firstPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // 等待2秒后跳到页面底部
            setTimeout(() => {
                log.info("跳转到页面底部");
                
                // 创建一个 End 键的事件
                const event = new KeyboardEvent('keydown', {
                    key: 'End',
                    keyCode: 35,
                    code: 'End',
                    which: 35,
                    bubbles: true,
                    cancelable: true,
                });

                // 触发该事件
                document.dispatchEvent(event);

                // 等待3秒后检查是否有新的话题列表
                setTimeout(() => {
                    const newTopicList = document.querySelectorAll('.topic-list-body tr.topic-list-item:not(.pinned) a.raw-topic-link');
                    
                    if (newTopicList.length > 0) {
                        log.info("发现 %s 个新话题，添加到列表中", newTopicList.length);
                        newTopicList.forEach((topic, index) => {
                            const topicPath = topic.pathname;
                            // 避免重复添加
                            if (!topics.includes(topicPath)) {
                                log.info('添加新话题: %s 《%s》', topicPath, topic.innerText);
                                topics.push(topicPath);
                            }
                        });
                    } else {
                        log.info("页面底部没有发现新话题");
                    }

                    resolve();
                }, 3000);
            }, 2000);
        });
    }

    // 检查当前是否在帖子页面
    const isOnTopicPage = document.querySelector('.post-stream') !== null;
    
    if (isOnTopicPage) {
        // 如果已经在帖子页面，直接开始阅读
        log.info('检测到当前在帖子页面，直接开始阅读');
        readPosts().then(() => {
            // 阅读完成后，随机延迟1-4秒进入下一个话题
            const randomDelay = Math.floor(Math.random() * 3000) + 1000;
            log.info("延迟 %s 毫秒后阅读新帖子", randomDelay);
            setTimeout(enterTopic, randomDelay);
        });
    } else {
        // 如果在首页，先加载话题列表
        log.info('检测到当前在首页，开始加载话题列表');
        getTopics().then((list) => {
            log.info('获取到 Topic 数量: %s', list.length);

            list.forEach((topic, index) => {
                log.info('获取到的 Topic: %s, %s 《%s》', index, topic.pathname, topic.innerText);
                topics.push(topic.pathname)
            })

            // 3秒后进入话题
            setTimeout(enterTopic, 3000);
        });
    }

})(200);
