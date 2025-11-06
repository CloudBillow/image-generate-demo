必须遵循：
视觉语气为冷静、克制、沉浸；2) 模块化组件；3) 暗色为主，支持亮色；4) 不使用 TailwindCSS。
色彩与 Token（必须原样实现）：
主品牌：--c-primary: #10A37F；主高亮：--c-primary-600: #0D8F71；浅高亮：--c-primary-300: #19C37D
中性色（暗）：
背景主体 --c-bg: #202123；对话区 --c-surface: #2A2B32；输入区 --c-input: #40414F
文本主 --c-text: #ECECEC；文本次 --c-text-2: #9CA3AF；分隔 --c-border: #2F313A
中性色（亮）：
背景主体 #F7F8FA；对话区 #FFFFFF；输入区 #F1F2F5；文本主 #1F2937；文本次 #6B7280；分隔 #E5E7EB
功能色：
成功 #16A34A / 浅 #22C55E；警告 #F59E0B / 浅 #FBBF24；错误 #EF4444 / 深 #DC2626；信息 #3B82F6
代码块：背景 #1E1E1E、边框 #2C2C2C、行号 #7C7C7C、关键字 #C586C0、字符串 #CE9178、函数 #4FC1FF
渐变：--g-primary: linear-gradient(90deg, #19C37D 0%, #10A37F 100%)
空间/圆角/阴影/动效/层级：
间距（px）：4, 8, 12, 16, 20, 24, 32, 40
圆角：容器 12px，按钮/输入 10px，气泡 16px
阴影：低 0 1px 4px rgba(0,0,0,.16)；中 0 4px 12px rgba(0,0,0,.24)；高 0 10px 24px rgba(0,0,0,.28)
动效：--motion-fast: 120ms、--motion-base: 200ms、--easing: cubic-bezier(.2,.6,.2,1)
层级：dropdown 1000、modal 1100、toast 1200、tooltip 1300
字体与排版：
字体族：Inter, SF Pro Text, PingFang SC, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif；等宽：JetBrains Mono
字号（px）：12, 14, 16(正文), 18, 20, 24, 32；行高：1.5
输入框：聚焦边框使用主色发光（外阴影 0 0 0 3px rgba(16,163,127,.25)）。
气泡：用户消息右对齐、品牌色底；AI 消息左对齐、深表面色；支持复制、反应表情、代码块复制。
Loading：三点闪烁；Skeleton 使用表面色+透明度。
无障碍：Tab 导航、Enter/Space 激活、Escape 关闭模态。
