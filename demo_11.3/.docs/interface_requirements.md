# 接口设计需求文档

**生成时间：** 2025-01-03
**基于文档：** demo_11.3/.requirements/detailed_requirements.md
**目标Agent：** Prompt4 接口设计Agent
**项目：** 12306火车票预订系统

---

## 用户身份管理模块

### 功能描述
提供用户注册、登录、个人信息管理的完整身份认证体系，支持实名制注册和安全登录

### 业务流程
1. 用户注册流程
   - 输入：手机号(string, 11位)、身份证号(string, 18位)、密码(string, 8-20位)、验证码(string, 6位)
   - 处理：手机号格式验证 → 身份证格式验证 → 唯一性检查 → 验证码校验 → 密码加密 → 用户创建
   - 输出：注册状态(boolean)、用户ID(string)、错误信息(string)

2. 用户登录流程
   - 输入：用户名/手机号(string)、密码(string)
   - 处理：用户存在性验证 → 密码校验 → 登录次数检查 → 会话创建 → Token生成
   - 输出：登录状态(boolean)、用户Token(string)、用户信息(object)、错误信息(string)

3. 个人信息管理流程
   - 输入：用户Token(string)、修改字段(object)
   - 处理：Token验证 → 权限检查 → 数据验证 → 信息更新
   - 输出：更新状态(boolean)、更新后信息(object)、错误信息(string)

### 异常处理
- **手机号格式错误**：输入非11位数字 → 返回"手机号格式不正确"
- **手机号已存在**：重复注册 → 返回"手机号已注册，请直接登录"
- **身份证格式错误**：输入非18位或格式错误 → 返回"身份证号格式不正确"
- **密码强度不足**：密码少于8位或无字母数字 → 返回"密码至少8位且包含字母数字"
- **验证码错误**：验证码不匹配或过期 → 返回"验证码错误或已过期"
- **登录失败**：用户名或密码错误 → 返回"用户名或密码错误"
- **账户锁定**：登录失败超过5次 → 返回"账户已锁定，请30分钟后重试"
- **Token过期**：会话超时 → 返回"登录已过期，请重新登录"

### 数据要求
- **输入数据**：phoneNumber(string), idCard(string), password(string), verificationCode(string), username(string), token(string)
- **输出数据**：status(boolean), message(string), userId(string), userToken(string), userInfo(object)
- **存储数据**：user_id, phone_number, id_card, password_hash, username, created_at, updated_at, login_attempts, locked_until

---

## 车票查询模块

### 功能描述
提供车票查询、筛选、详情展示功能，支持多维度查询和实时余票信息

### 业务流程
1. 基础查询流程
   - 输入：出发地(string)、目的地(string)、出发日期(date)
   - 处理：参数验证 → 日期范围检查 → 数据库查询 → 结果排序 → 余票统计
   - 输出：车次列表(array)、查询状态(boolean)、总数量(number)

2. 结果筛选流程
   - 输入：车次类型(array)、席别类型(array)、时间范围(object)
   - 处理：条件过滤 → 结果重新排序 → 分页处理
   - 输出：筛选后列表(array)、筛选条件(object)、分页信息(object)

3. 车次详情流程
   - 输入：车次号(string)、查询日期(date)
   - 处理：车次信息查询 → 座位信息查询 → 余票实时更新
   - 输出：车次详情(object)、座位信息(array)、余票信息(object)

### 异常处理
- **参数缺失**：必填参数为空 → 返回"请填写完整的查询信息"
- **日期无效**：选择过去日期或超过30天 → 返回"请选择有效的出发日期"
- **城市不存在**：输入无效城市名 → 返回"未找到该城市，请重新选择"
- **无查询结果**：无匹配车次 → 返回"暂无符合条件的车次，建议调整查询条件"
- **查询超时**：数据库查询超时 → 返回"查询超时，请稍后重试"
- **系统繁忙**：并发查询过多 → 返回"系统繁忙，请稍后重试"

### 数据要求
- **输入数据**：departureCity(string), arrivalCity(string), departureDate(date), trainTypes(array), seatTypes(array), timeRange(object)
- **输出数据**：trainList(array), totalCount(number), pageInfo(object), queryStatus(boolean), message(string)
- **存储数据**：train_id, train_number, departure_city, arrival_city, departure_time, arrival_time, duration, seat_types, ticket_prices

---

## 车票预订模块

### 功能描述
提供车票预订、订单填写、订单管理的完整预订体系，支持多乘客预订和订单生命周期管理

### 业务流程
1. 车票预订流程
   - 输入：车次号(string)、席别(string)、数量(number)、用户Token(string)
   - 处理：登录验证 → 余票检查 → 座位分配 → 预订锁定 → 订单创建
   - 输出：预订状态(boolean)、订单ID(string)、座位信息(array)、锁定时间(number)

2. 订单填写流程
   - 输入：订单ID(string)、乘客信息(array)、联系方式(object)
   - 处理：订单验证 → 乘客信息验证 → 订单信息补全 → 金额计算
   - 输出：订单详情(object)、应付金额(number)、填写状态(boolean)

3. 订单管理流程
   - 输入：用户Token(string)、操作类型(string)、订单ID(string)
   - 处理：权限验证 → 订单状态检查 → 业务逻辑处理 → 状态更新
   - 输出：操作结果(boolean)、订单状态(string)、更新信息(object)

### 异常处理
- **未登录**：Token无效或过期 → 返回"请先登录"
- **余票不足**：选择席别无票 → 返回"该席别余票不足，请选择其他席别"
- **订单超时**：30分钟未支付 → 自动取消订单，返回"订单已超时取消"
- **重复预订**：同一车次重复预订 → 返回"您已预订该车次，请勿重复预订"
- **乘客信息错误**：身份信息验证失败 → 返回"乘客信息有误，请核实后重新填写"
- **支付失败**：支付接口异常 → 返回"支付失败，请重新尝试"
- **订单不存在**：查询不存在的订单 → 返回"订单不存在或已被删除"

### 数据要求
- **输入数据**：trainNumber(string), seatType(string), quantity(number), userToken(string), passengerInfo(array), contactInfo(object), orderId(string), operationType(string)
- **输出数据**：bookingStatus(boolean), orderId(string), seatInfo(array), lockTime(number), orderDetails(object), totalAmount(number), orderStatus(string)
- **存储数据**：order_id, user_id, train_id, seat_numbers, passenger_list, contact_info, total_amount, order_status, created_at, expire_at

---

## 乘客信息管理模块

### 功能描述
提供常用乘客信息的添加、编辑、删除管理功能，支持实名制验证和快速选择

### 业务流程
1. 添加乘客流程
   - 输入：用户Token(string)、姓名(string)、证件类型(string)、证件号(string)、乘客类型(string)
   - 处理：Token验证 → 乘客数量检查 → 证件格式验证 → 重复检查 → 信息加密存储
   - 输出：添加状态(boolean)、乘客ID(string)、错误信息(string)

2. 编辑乘客流程
   - 输入：用户Token(string)、乘客ID(string)、修改信息(object)
   - 处理：权限验证 → 乘客存在性检查 → 信息验证 → 数据更新
   - 输出：更新状态(boolean)、更新后信息(object)、错误信息(string)

3. 删除乘客流程
   - 输入：用户Token(string)、乘客ID(string)
   - 处理：权限验证 → 关联订单检查 → 确认删除 → 数据清理
   - 输出：删除状态(boolean)、错误信息(string)

### 异常处理
- **乘客数量超限**：超过10个乘客 → 返回"最多只能添加10个常用乘客"
- **证件格式错误**：证件号格式不正确 → 返回"证件号格式不正确，请重新输入"
- **重复添加**：相同证件号已存在 → 返回"该乘客信息已存在，请勿重复添加"
- **乘客不存在**：编辑不存在的乘客 → 返回"乘客信息不存在"
- **有未完成订单**：删除有关联订单的乘客 → 返回"该乘客有未完成订单，暂时无法删除"
- **权限不足**：操作他人乘客信息 → 返回"无权限操作该乘客信息"

### 数据要求
- **输入数据**：userToken(string), passengerName(string), idType(string), idNumber(string), passengerType(string), passengerId(string), updateInfo(object)
- **输出数据**：operationStatus(boolean), passengerId(string), passengerInfo(object), message(string)
- **存储数据**：passenger_id, user_id, passenger_name, id_type, id_number, passenger_type, created_at, updated_at

---

## 系统导航模块

### 功能描述
提供系统首页导航和整体用户界面框架，支持权限控制和状态管理

### 业务流程
1. 首页访问流程
   - 输入：用户Token(string, 可选)
   - 处理：Token验证 → 权限判断 → 个性化内容加载 → 页面渲染
   - 输出：页面内容(object)、用户状态(object)、导航菜单(array)

2. 功能导航流程
   - 输入：目标页面(string)、用户Token(string, 可选)
   - 处理：路由验证 → 权限检查 → 状态保持 → 页面跳转
   - 输出：跳转状态(boolean)、目标页面(string)、错误信息(string)

3. 状态管理流程
   - 输入：操作类型(string)、状态数据(object)
   - 处理：状态验证 → 数据更新 → 界面刷新 → 持久化存储
   - 输出：更新状态(boolean)、最新状态(object)

### 异常处理
- **页面不存在**：访问无效路由 → 跳转到404页面
- **权限不足**：未登录访问受限页面 → 跳转到登录页面
- **网络异常**：连接失败 → 显示离线状态提示
- **系统维护**：服务不可用 → 显示维护通知页面

### 数据要求
- **输入数据**：userToken(string), targetPage(string), operationType(string), stateData(object)
- **输出数据**：pageContent(object), userStatus(object), navigationMenu(array), redirectStatus(boolean)
- **存储数据**：user_session, page_state, navigation_history

---

## 支付处理模块

### 功能描述
提供简化的订单支付功能，支持多种支付方式和安全验证

### 业务流程
1. 支付发起流程
   - 输入：订单ID(string)、支付方式(string)、用户Token(string)
   - 处理：订单验证 → 金额计算 → 支付渠道选择 → 支付请求创建
   - 输出：支付链接(string)、支付ID(string)、支付状态(string)

2. 支付处理流程
   - 输入：支付ID(string)、支付确认(object)
   - 处理：支付验证 → 第三方接口调用 → 结果验证 → 订单状态更新
   - 输出：支付结果(boolean)、交易流水号(string)、错误信息(string)

3. 支付结果处理流程
   - 输入：支付回调(object)
   - 处理：签名验证 → 订单匹配 → 状态同步 → 通知发送
   - 输出：处理状态(boolean)、订单状态(string)、通知结果(boolean)

### 异常处理
- **订单不存在**：支付无效订单 → 返回"订单不存在或已失效"
- **订单已支付**：重复支付 → 返回"订单已支付，请勿重复支付"
- **支付超时**：支付时间过长 → 返回"支付超时，请重新尝试"
- **余额不足**：账户余额不够 → 返回"余额不足，请充值或更换支付方式"
- **支付失败**：第三方支付异常 → 返回"支付失败，请稍后重试"
- **系统异常**：支付系统故障 → 返回"支付系统维护中，请稍后重试"

### 数据要求
- **输入数据**：orderId(string), paymentMethod(string), userToken(string), paymentId(string), paymentConfirm(object), paymentCallback(object)
- **输出数据**：paymentUrl(string), paymentId(string), paymentStatus(string), paymentResult(boolean), transactionId(string), message(string)
- **存储数据**：payment_id, order_id, payment_method, amount, payment_status, transaction_id, created_at, completed_at