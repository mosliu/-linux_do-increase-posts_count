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
            is_read_all = false
            readPosts().then(() => {
                log.info("setTimeout.enterTopic: 延迟5秒后阅读新帖子");
                setTimeout(enterTopic, 5000);
            });
        }, 5000);
    }

    // 记录回复总数
    let post_total_count = 0, is_read_all = false;

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

            // 如果已有帖子列表
            const topic = document.querySelector('.topic-list-body tr.topic-list-item a.raw-topic-link');
            log.debug("readPosts.not unread: %s, %s", topic, postListDom);
            if (topic) {
                if (is_read_all) {
                    resolve(topic);
                    return;
                }
                is_read_all = true;
            }

            // 获取回复列表
            const post_all = document.querySelectorAll('.post-stream .topic-post');
            let postItemList = document.querySelectorAll('.post-stream .topic-post .read-state:not(.read)');

            if (post_all.length != post_total_count) {
                post_total_count = post_all.length;
            } else {
                log.info("没有新帖子, 直接读所有帖子");
                postItemList = post_all
            }

            // 获取未读帖子列表
            log.debug("readPosts.unread.length: %s", postItemList.length);

            // 如果没有未读
            if (postItemList.length === 0) {
                log.info("没有未读帖子, 5秒后重新获取");
                setTimeout(() => {
                    readPosts().then(resolve);
                }, 5000);
                return;
            }

            // 如果未读帖子超过30个 就跳出吧
            if (postItemList.length > 30) {
                log.info("未读帖子超过30个, 毁灭吧, 开始下一次吧");

                // 需要把当前页面地址放回到topics中
                topics.push(window.location.pathname);

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

                // 直接跳出到下一个话题
                setTimeout(() => {
                    is_read_all = true;
                    readPosts().then(resolve);
                }, 5000);
                return;
            }

            // 每3秒为 postItemList 中的每一个执行 scrollIntoView
            let postItemNum = 0;
            function scrollToNextPost() {
                const postItem = postItemList[postItemNum];
                log.debug("scrollToNextPost.postItem: %s", postItem);

                // 如果取不出 post 则重新获取
                if (!postItem) {
                    setTimeout(() => {
                        readPosts().then(resolve);
                    }, 5000);
                    return;
                }

                if (postItem.className == 'read-state') {
                    log.info("阅读帖子: %s", postItem.parentNode.parentElement.innerText);
                } else {
                    log.info("阅读帖子: %s", postItem.querySelector('.topic-meta-data')?.innerText);
                }

                setTimeout(() => {
                    postItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    postItemNum += 1;

                    // 有 10% 的概率点赞
                    if (Math.random() < 0.3) {
                        log.info('点赞')
                        postItem.parentElement.parentElement.parentElement.querySelector('.actions button.btn-toggle-reaction-like').click();
                    }

                    scrollToNextPost();
                }, 2000);
            }
            scrollToNextPost();
        })
    }

    // 加载话题
    getTopics().then((list) => {
        log.info('获取到 Topic 数量: %s', list.length);

        list.forEach((topic, index) => {
            log.info('获取到的 Topic: %s, %s 《%s》', index, topic.pathname, topic.innerText);
            topics.push(topic.pathname)
        })

        // 3秒后进入话题
        setTimeout(enterTopic, 3000);
    });

})(100);
