# 服务器 MySQL 管理：创建 content_ip_workbench 数据库并配置 root 免密管理员

作者：Monkeycode

## 项目简介

为另一个项目（content IP workbench）在线上服务器 `124.223.3.175`（主机名 `VM-0-3-ubuntu`，Ubuntu 24.04.4）的 MySQL 8.0 实例上：

1. 创建隔离数据库 `content_ip_workbench`（utf8mb4 / utf8mb4_unicode_ci）和专用应用账号 `content_ip_app`；
2. 将 MySQL `root@localhost` 认证方式改为 `auth_socket` 免密登录，解决管理员密码遗忘问题。

过程中确认：我赢AI线上数据库 `woying_ai` 一直存在（历史 `backend/docs/schema.sql` 有完整建表设计），服务器上另有其他项目库 `niuniu_parenting`。

## 使用方式

### 进服务器（SSH）

```bash
ssh -i <私钥路径> ubuntu@124.223.3.175
```

私钥文件：`.monkeycode/uploads/WOYING.pem`（`WOYING-2.pem` 为内容完全相同的重名副本，SHA256 一致，未生成任何新密钥）。

### 进 MySQL 数据库管理控制台（免密）

```bash
# 方式一：root 免密（auth_socket，推荐日常使用）
sudo mysql

# 方式二：系统维护账号 debian-sys-maint（全库管理员，备用通道）
sudo mysql --defaults-file=/etc/mysql/debian.cnf
```

### content_ip_app 应用账号连接信息

| 项目 | 值 |
| --- | --- |
| 数据库名 | `content_ip_workbench` |
| 用户 | `content_ip_app`（`@localhost` 与 `@127.0.0.1`） |
| 地址 | 127.0.0.1 |
| 端口 | 3306 |
| 权限 | 仅 `content_ip_workbench.*` 全权 |
| 密码 | 见密码文件（下方"关键文件"），48 位随机十六进制 |

## 当前状态

✅ 已完成，全部验证通过：

- `content_ip_workbench` 库存在，`content_ip_app` 通过 `127.0.0.1:3306` 实际连接成功；
- `sudo mysql` 以 `root@localhost` 免密进入，可见 `woying_ai`、`niuniu_parenting`、`content_ip_workbench` 三个业务库；
- 业务账号 `woying`、`niuniu`、`content_ip_app` 认证方式未变，后端 `woying-backend` 保持 online。

未修改：`woying_ai`、`niuniu_parenting`、Nginx、PM2、任何现有项目配置。

## 关键文件

- 本 README：任务说明
- 密码文件（仅本机 Alex 账户可读写，**不提交 Git、不进聊天记录**）：
  `C:\Users\Alex\AppData\Roaming\com.chaitin.baizhi.monkeycode\ohmyagent\content-ip-app-password.txt`
- 私钥：`.monkeycode/uploads/WOYING.pem` / `WOYING-2.pem`（内容相同）
- 我赢AI历史数据库设计：`backend/docs/schema.sql`、`backend/docs/migrations/add-user-feedbacks.sql`

## 关键依赖

- SSH（私钥认证）
- MySQL 8.0.45（Ubuntu 包），系统维护账号 `debian-sys-maint`（`/etc/mysql/debian.cnf`）
- `auth_socket` 认证插件（本次已加载启用）

## 安全边界

- `root` 仅能通过服务器本机 socket 免密进入，`127.0.0.1:3306` 远程 TCP 的 root 登录被拒绝；
- 任何拥有系统 `sudo` 权限的用户 = MySQL 全权管理员（当前服务器上仅 Alex）；
- 私钥即"服务器钥匙"：谁拿到私钥谁就能进服务器并进数据库，密钥必须只放在信得过的电脑上；
- 需要恢复 root 密码登录时可执行：
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '新密码';
  ```

## 下次接着做什么

1. 另一个项目使用 `content_ip_workbench` 连接信息配置后端，密码从密码文件安全传递；
2. 我赢AI线上 `backend/.env` 目前无 `DB_*`/`MYSQL_*` 配置，实际存储仍为 JSON/mock；如需切换 MySQL 需单独评估迁移，不与新库混用；
3. 建议把 `content_ip_app` 密码转存密码管理器后删除本地明文密码文件。
