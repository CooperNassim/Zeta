import re
import json
from datetime import datetime, timedelta
import random

# 读取文件
with open('d:/Code/Zeta/src/store/useStore.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到 tradeRecords 数组
start = content.find('tradeRecords: [')
if start == -1:
    print("未找到 tradeRecords")
    exit(1)

# 找到对应的结束位置（找到与之匹配的 ]）
depth = 0
pos = start + len('tradeRecords:')
i = pos
while i < len(content):
    if content[i] == '[':
        depth += 1
    elif content[i] == ']':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
    i += 1

# 提取 JSON 部分
json_str = content[start + len('tradeRecords: '):end]

# 移除 JavaScript 的注释
json_str = re.sub(r'//.*$', '', json_str, flags=re.MULTILINE)

# 解析 JSON
records = json.loads(json_str)

# 为每条记录添加预约价格字段
for record in records:
    if record.get('tradeType') == '买入':
        # 添加买入预约价格（比实际买入价低3-5）
        price_offset = round(random.uniform(3, 5), 2)
        record['buyOrderPrice'] = round(record['buyPrice'] - price_offset, 2)

        # 添加买入预约时间（比实际买入时间早1-2天）
        buy_time = datetime.fromisoformat(record['buyTime'].replace('Z', '+00:00'))
        days_before = random.randint(1, 2)
        order_time = buy_time - timedelta(days=days_before)
        record['buyOrderTime'] = order_time.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

        # 卖出预约价格设为null
        record['sellOrderPrice'] = None
        record['sellOrderTime'] = None

    elif record.get('tradeType') == '卖出':
        # 添加卖出预约价格（比实际卖出价高3-5）
        price_offset = round(random.uniform(3, 5), 2)
        record['sellOrderPrice'] = round(record['sellPrice'] + price_offset, 2)

        # 添加卖出预约时间（比实际卖出时间早1-2天）
        sell_time = datetime.fromisoformat(record['sellTime'].replace('Z', '+00:00'))
        days_before = random.randint(1, 2)
        order_time = sell_time - timedelta(days=days_before)
        record['sellOrderTime'] = order_time.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

# 将更新后的记录转换回字符串格式
new_json_str = json.dumps(records, indent=8, ensure_ascii=False)

# 替换原数组
new_content = content[:start + len('tradeRecords: ')] + new_json_str + content[end:]

# 写回文件
with open('d:/Code/Zeta/src/store/useStore.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('交易记录更新完成')
