# BushView

BushView, 国服英雄联盟战绩查询软件

## TODO
优化 op.gg 抓取 selector，确保稳定获取数据
美化 UI，改成卡片展示而不是 JSON dump
增加本地缓存和错误提示
继续实现更完整的比赛历史解析与显示

## 功能

- op.gg 版本英雄数据
- 召唤师查询

## 开发
### 安装

首先，确保你已经安装了 Node.js 和 npm。然后运行以下命令来安装依赖：

```bash
npm install
```

### 运行

启动开发版本：

```bash
npm start
```

### 打包

打包应用程序：

```bash
npm run package
```

创建安装包：

```bash
npm run make
```

### 发布

发布应用程序：

```bash
npm run publish
```

### 代码检查

运行 ESLint 检查代码：

```bash
npm run lint
```

## 许可证

MIT License

## 作者

kaiwei (me@kaiweizhang.com)