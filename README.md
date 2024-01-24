## 前言

2023-05-20 花了两天时间也算是写完了，当然还有很多不足之处，后续肯定会慢慢优化的！（继续堆屎）

2024-01-23 重构重构，直接往 JS 里面写 HTML 代码的方式实在是看不下去了，我自己都改不动了…… 😭

![](https://cdn.jsdelivr.net/gh/fengstats/blogcdn@main/2024/%E6%97%A5%E8%AE%B0%E6%97%B6%E9%95%BF%E7%BB%9F%E8%AE%A1-01-24%20%E9%A2%84%E8%A7%88.png)

### 任务和功能

- [x] 读取文件内容
- [x] 根据标题分类解析出需要参与计算的时间
- [x] 支持自动计算支出小记/收入小记
- [x] 生成 Record 写入原文件
- [x] 输出 Record 统计显示面板
- [x] 在 uTools 中通过 HTML 输出显示面板
- [x] 添加进度显示
- [x] 优化进度条显示，添加百分比进度小球
- [ ] 新建仓库重构一版

### 如何使用？

⚠️ 脚本作为参考就好啦~ **不推荐使用**，毕竟太过个人定制，大概率是不适合你的，除非你直接同步我的日记记录方式，再者说了，这代码就是一坨……

其实就是在一个二级标题下 → 任务列表 → 追加上加粗的时间，格式为：**1h**、**1h10min**、**10min** 这三种

同时还支持在一个任务列表后面写多个时间，也会把帮你计算入内，只会统计已完成的任务列表数据，如下：

- [x] 任务 1 **1h**
- [x] 任务 2 **30min**
- [x] 任务 3 **1h30min**
- [x] 任务 4 **1h** + **30min**
- [x] 任务 5 **1h** / **30min**
- [ ] 未勾选完成的任务列表时间不会被统计入内 **1h**

### 一些效果预览

> 2023-05-20 在原文件上所生成的 Record 标题与信息

![](https://cdn.jsdelivr.net/gh/fengstats/blogcdn@main/2023/%E6%97%A5%E8%AE%B0%E6%97%B6%E9%95%BF%E5%88%86%E6%9E%90%E8%84%9A%E6%9C%AC%20Record.png)

> 2023-05-20 uTools 内输出面板

![](https://cdn.jsdelivr.net/gh/fengstats/blogcdn@main/2023/%E6%97%A5%E8%AE%B0%E6%97%B6%E9%95%BF%E7%BB%9F%E8%AE%A1%E8%84%9A%E6%9C%AC%20uTools.png)

> 2024-01-12 uTools 内添加进度条

![](https://cdn.jsdelivr.net/gh/fengstats/blogcdn@main/2024/%E6%97%A5%E8%AE%B0%E6%97%B6%E9%95%BF%E7%BB%9F%E8%AE%A1-%E6%B7%BB%E5%8A%A0%E8%BF%9B%E5%BA%A6%E6%9D%A1.png)

> 2024-01-20 uTools 内优化进度条显示

![](https://cdn.jsdelivr.net/gh/fengstats/blogcdn@main/2024/%E6%97%A5%E8%AE%B0%E6%97%B6%E9%95%BF%E7%BB%9F%E8%AE%A1-%E4%BC%98%E5%8C%96%E8%BF%9B%E5%BA%A6%E6%9D%A1%E6%A0%B7%E5%BC%8F.png)

## 为啥写这个脚本

简单聊聊为啥写这个脚本，因为 **Record** 部分统计时长数据是各个标题 → 各个任务耗时汇总计算出来的，这件事情在我手动的情况下每次大概需要 10 分钟左右，当然这还是快的情况下，来看看我统计总时长的步骤

### 先看标题

比如 **重要的事**，再看单任务后面记录的时间，手动一个个加起来，比如：50+15+10+25+45…，一些随意的假数据，若全都是分钟还好可以直接加，但遇到小时单位就稍微麻烦点了，需要先脑内换算一下分钟，比如 **2h35min** 就是 155 分钟

### 时间换算与递归操作

加完之后是分钟单位，写到 **Record** 的数据需要小时 + 分钟的形式，所以又得重新换算一次…

接着就是继续第二个标题，重复第一步的操作，知道所有标题数据都统计结束。

### 总时长计算

把刚刚统计的时间变成总时长，对了还有睡眠时长也要，一般是不会记录总分钟形式，通常都是小时 + 分钟，所以这里肯定要先手动来转一下，至于其他标题汇总时长，如果刚刚保留了总分钟还好，把总分钟都加起来，最后再转换成小时 + 分钟就完事了，没有的话，那就再转换一遍吧。

### 总结

其实最主要的是什么呢？把这件事情交给人来做，总会有算错的时候，有几次发现自己统计的时候漏掉了或者加错了，让计算机来做是最合适的，不过之前太懒虽然加了 TodoList 但一直没挑出来做，有空了就稍微写下，发现也挺简单的。
