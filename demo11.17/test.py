from selenium import webdriver
from selenium.webdriver.common.by import By
from PIL import Image
import json
import os

class PixelPerfectExtractor:
    def __init__(self, url):
        self.url = url
        self.output_dir = './ui_extraction'
        self.setup_directories()
        
    def setup_directories(self):
        """创建输出目录结构"""
        dirs = [
            'screenshots',      # 截图
            'measurements',     # 测量数据
            'assets',          # 静态资源
            'specifications',  # 设计规范
            'html_raw'        # 原始HTML
        ]
        for d in dirs:
            os.makedirs(f'{self.output_dir}/{d}', exist_ok=True)
    
    def extract_all(self):
        """完整提取流程"""
        options = webdriver.ChromeOptions()
        options.add_argument('--force-device-scale-factor=1')  # 确保1:1像素
        options.add_argument('--high-dpi-support=1')
        options.add_argument('--window-size=1920,1080')
        
        driver = webdriver.Chrome(options=options)
        
        try:
            print(f'📡 访问: {self.url}')
            driver.get(self.url)
            driver.implicitly_wait(5)
            
            # 1. 全页面截图（参考基准）
            self._capture_screenshots(driver)
            
            # 2. 提取所有元素的精确位置和样式
            elements_data = self._extract_elements_data(driver)
            
            # 3. 提取颜色、字体、间距规范
            design_tokens = self._extract_design_tokens(driver)
            
            # 4. 提取资源文件
            self._extract_resources(driver)
            
            # 5. 生成设计规范文档
            self._generate_specifications(elements_data, design_tokens)
            
            print('✅ 提取完成!')
            
        finally:
            driver.quit()
    
    def _capture_screenshots(self, driver):
        """多尺寸截图"""
        # 全页面截图
        driver.save_screenshot(f'{self.output_dir}/screenshots/full_page.png')
        
        # 关键区域截图
        sections = {
            'header': (By.CSS_SELECTOR, '.login-hd'),
            'form': (By.CSS_SELECTOR, '.login-form'),
            'footer': (By.CSS_SELECTOR, '.login-ft')
        }
        
        for name, (by, selector) in sections.items():
            try:
                element = driver.find_element(by, selector)
                element.screenshot(f'{self.output_dir}/screenshots/{name}.png')
            except:
                print(f'⚠️  未找到元素: {selector}')
    
    def _extract_elements_data(self, driver):
        """提取所有元素的精确数据"""
        script = """
        function extractElement(el, path = '') {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            
            // 生成唯一路径
            const tagName = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
            const currentPath = `${path} > ${tagName}${id}${classes}`;
            
            const data = {
                path: currentPath,
                tag: tagName,
                id: el.id,
                classes: Array.from(el.classList),
                text: el.innerText?.substring(0, 50) || '',
                
                // 精确位置（相对于视口）
                position: {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                },
                
                // 关键样式
                styles: {
                    display: styles.display,
                    position: styles.position,
                    fontSize: styles.fontSize,
                    fontFamily: styles.fontFamily,
                    fontWeight: styles.fontWeight,
                    color: styles.color,
                    backgroundColor: styles.backgroundColor,
                    border: styles.border,
                    borderRadius: styles.borderRadius,
                    padding: styles.padding,
                    margin: styles.margin,
                    lineHeight: styles.lineHeight,
                    textAlign: styles.textAlign
                },
                
                // 交互属性
                interactive: {
                    clickable: el.onclick !== null || el.tagName === 'A' || el.tagName === 'BUTTON',
                    type: el.type || null,
                    placeholder: el.placeholder || null,
                    href: el.href || null
                }
            };
            
            // 递归子元素
            if (el.children.length > 0 && el.children.length < 50) {
                data.children = Array.from(el.children).map(child => 
                    extractElement(child, currentPath)
                );
            }
            
            return data;
        }
        
        return extractElement(document.body, 'body');
        """
        
        elements_data = driver.execute_script(script)
        
        # 保存为JSON
        with open(f'{self.output_dir}/measurements/elements.json', 'w', encoding='utf-8') as f:
            json.dump(elements_data, f, indent=2, ensure_ascii=False)
        
        return elements_data
    
    def _extract_design_tokens(self, driver):
        """提取设计令牌（颜色、字体、间距）"""
        script = """
        const tokens = {
            colors: new Set(),
            fonts: new Set(),
            fontSizes: new Set(),
            spacings: new Set(),
            borderRadius: new Set()
        };
        
        function extractTokens(el) {
            const styles = window.getComputedStyle(el);
            
            // 颜色
            if (styles.color) tokens.colors.add(styles.color);
            if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                tokens.colors.add(styles.backgroundColor);
            }
            
            // 字体
            if (styles.fontFamily) tokens.fonts.add(styles.fontFamily);
            if (styles.fontSize) tokens.fontSizes.add(styles.fontSize);
            
            // 间距
            if (styles.padding && styles.padding !== '0px') tokens.spacings.add(styles.padding);
            if (styles.margin && styles.margin !== '0px') tokens.spacings.add(styles.margin);
            
            // 圆角
            if (styles.borderRadius && styles.borderRadius !== '0px') {
                tokens.borderRadius.add(styles.borderRadius);
            }
            
            Array.from(el.children).forEach(child => extractTokens(child));
        }
        
        extractTokens(document.body);
        
        return {
            colors: Array.from(tokens.colors),
            fonts: Array.from(tokens.fonts),
            fontSizes: Array.from(tokens.fontSizes),
            spacings: Array.from(tokens.spacings),
            borderRadius: Array.from(tokens.borderRadius)
        };
        """
        
        tokens = driver.execute_script(script)
        
        with open(f'{self.output_dir}/specifications/design_tokens.json', 'w', encoding='utf-8') as f:
            json.dump(tokens, f, indent=2, ensure_ascii=False)
        
        return tokens
    
    def _extract_resources(self, driver):
        """提取静态资源"""
        resources = driver.execute_script("""
            return {
                images: Array.from(document.images).map(img => ({
                    src: img.src,
                    alt: img.alt,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                })),
                stylesheets: Array.from(document.styleSheets).map(sheet => sheet.href).filter(Boolean),
                scripts: Array.from(document.scripts).map(s => s.src).filter(Boolean)
            };
        """)
        
        with open(f'{self.output_dir}/specifications/resources.json', 'w', encoding='utf-8') as f:
            json.dump(resources, f, indent=2, ensure_ascii=False)
    
    def _generate_specifications(self, elements_data, design_tokens):
        """生成可读的设计规范文档"""
        spec = f"""# 12306 登录页面设计规范

## 📐 布局尺寸
- 页面宽度: 1920px (标准桌面)
- 内容区宽度: 根据实际测量 (见 measurements/elements.json)

## 🎨 颜色规范
主要颜色:
{chr(10).join(f'- {color}' for color in design_tokens['colors'][:10])}

## 🔤 字体规范
字体族: {', '.join(set(design_tokens['fonts']))}
字号: {', '.join(sorted(set(design_tokens['fontSizes'])))}

## 📏 间距系统
{', '.join(sorted(set(design_tokens['spacings']))[:10])}

## 🔲 圆角规范
{', '.join(sorted(set(design_tokens['borderRadius'])))}

## 📄 完整数据
详见以下文件:
- measurements/elements.json - 所有元素的精确位置和样式
- specifications/design_tokens.json - 设计令牌
- specifications/resources.json - 资源文件清单
"""
        
        with open(f'{self.output_dir}/DESIGN_SPEC.md', 'w', encoding='utf-8') as f:
            f.write(spec)

# 使用示例
if __name__ == '__main__':
    extractor = PixelPerfectExtractor('https://kyfw.12306.cn/otn/resources/login.html')
    extractor.extract_all()