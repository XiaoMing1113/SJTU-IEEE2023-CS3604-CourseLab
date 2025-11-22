import os
import re
import time
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

# --- 配置区域 ---
TARGET_URL = "https://www.12306.cn/index/"
# 模拟浏览器，防止被反爬虫拦截
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
# 下载保存路径 (临时文件夹，整理好后再放入 frontend)
SAVE_DIR = "downloaded_assets"


class ResourceCrawler:
    def __init__(self, base_url, save_dir):
        self.base_url = base_url
        self.save_dir = save_dir
        self.visited_urls = set()
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

        # 创建保存目录
        self.img_dir = os.path.join(save_dir, "images")
        self.css_dir = os.path.join(save_dir, "css")
        os.makedirs(self.img_dir, exist_ok=True)
        os.makedirs(self.css_dir, exist_ok=True)

    def download_file(self, url, category="images"):
        """通用文件下载函数"""
        if url in self.visited_urls:
            return None

        try:
            # 1. 处理 URL
            if url.startswith("//"):
                url = "https:" + url
            full_url = urljoin(self.base_url, url)

            # 排除非图片/CSS资源
            if not any(
                full_url.lower().endswith(ext)
                for ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".css"]
            ):
                return None

            # 2. 发送请求
            print(f"⬇️ 正在下载: {full_url} ...")
            response = self.session.get(full_url, timeout=10)

            if response.status_code == 200:
                # 3. 提取文件名
                parsed_url = urlparse(full_url)
                filename = os.path.basename(parsed_url.path)
                if not filename:
                    filename = f"resource_{int(time.time())}.ext"

                # 4. 保存文件
                target_dir = self.css_dir if category == "css" else self.img_dir
                save_path = os.path.join(target_dir, filename)

                with open(save_path, "wb") as f:
                    f.write(response.content)

                self.visited_urls.add(url)
                print(f"✅ 已保存: {save_path}")
                return save_path, response.text  # 返回内容供CSS分析用
            else:
                print(f"❌ 下载失败 (状态码 {response.status_code}): {full_url}")

        except Exception as e:
            print(f"⚠️ 下载出错: {url} - {e}")
        return None, None

    def parse_css_for_images(self, css_content, css_url):
        """从 CSS 内容中提取 url(...) 里的图片"""
        if not css_content:
            return

        # 正则匹配 url('...') 或 url("...") 或 url(...)
        # 这是一个非常强大的正则，能捕获大部分 CSS 图片引用
        urls = re.findall(r'url\((?:[\'"]?)(.*?)(?:[\'"]?)\)', css_content)

        for relative_url in urls:
            # 过滤掉 base64 数据和无关链接
            if relative_url.startswith("data:") or len(relative_url) < 5:
                continue

            # 注意：CSS 里的图片路径是相对于 CSS 文件本身的！
            # 所以我们要用 css_url 作为 base 来拼接
            absolute_img_url = urljoin(css_url, relative_url)
            self.download_file(absolute_img_url, category="images")

    def run(self):
        print(f"🚀 开始抓取: {self.base_url}")

        try:
            # 1. 访问主页
            response = self.session.get(self.base_url)
            response.encoding = "utf-8"
            soup = BeautifulSoup(response.text, "html.parser")

            # 2. 抓取 HTML 中的 img 标签
            print("\n--- 📷 分析 HTML 图片 ---")
            images = soup.find_all("img")
            for img in images:
                src = img.get("src")
                if src:
                    self.download_file(src, category="images")

            # 3. 抓取 CSS 文件，并深入分析 CSS 里的背景图
            print("\n--- 🎨 分析 CSS 及背景图 ---")
            links = soup.find_all("link", rel="stylesheet")
            for link in links:
                href = link.get("href")
                if href:
                    # 下载 CSS 文件本身，并获取其内容进行二次分析
                    saved_path, css_content = self.download_file(href, category="css")

                    # 如果 CSS 下载成功，解析里面的图片
                    if saved_path:
                        # 构造这个 CSS 文件的完整 URL，用于解析它内部的相对路径
                        full_css_url = urljoin(self.base_url, href)
                        self.parse_css_for_images(css_content, full_css_url)

        except Exception as e:
            print(f"❌ 发生严重错误: {e}")

        print(f"\n🎉 抓取完成！资源已保存在: {self.save_dir}")


if __name__ == "__main__":
    crawler = ResourceCrawler(TARGET_URL, SAVE_DIR)
    crawler.run()
