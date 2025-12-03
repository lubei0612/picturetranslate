"""图片翻译 MVP - Streamlit 应用"""

import streamlit as st
from PIL import Image
from io import BytesIO
import os

from processor import ImageTranslator, MAX_FILE_SIZE

st.set_page_config(
    page_title="图片翻译工具",
    page_icon="🌐",
    layout="wide"
)

# 语言选项
LANGUAGES = {
    "中文": "zh",
    "英语": "en",
    "日语": "ja",
    "韩语": "ko",
    "法语": "fr",
    "德语": "de",
    "西班牙语": "es",
    "俄语": "ru",
}

@st.cache_resource
def get_translator():
    """缓存翻译器实例"""
    return ImageTranslator()


def main():
    st.title("🌐 电商图片翻译工具")
    st.markdown("上传商品图片，自动翻译图片中的文字，保护商品主体不被破坏")
    
    # 检查配置
    if not os.getenv("ALI_ACCESS_KEY_ID") or not os.getenv("ALI_ACCESS_KEY_SECRET"):
        st.error("❌ 请配置环境变量 ALI_ACCESS_KEY_ID 和 ALI_ACCESS_KEY_SECRET")
        st.stop()
    
    # 侧边栏设置
    with st.sidebar:
        st.header("翻译设置")
        
        source_lang = st.selectbox(
            "源语言",
            options=["自动检测"] + list(LANGUAGES.keys()),
            index=0
        )
        
        target_lang = st.selectbox(
            "目标语言",
            options=list(LANGUAGES.keys()),
            index=0  # 默认中文
        )
        
        field = st.radio(
            "翻译模式",
            options=["电商图片", "通用图片"],
            index=0
        )
        
        st.markdown("---")
        st.markdown("**后处理优化**")
        enable_postprocess = st.checkbox(
            "启用智能后处理",
            value=True,
            help="自动优化翻译质量：数字本地化(2.5M→250万份)、术语修正(畅销书→畅销品)、字体颜色优化"
        )
        
        st.markdown("---")
        st.markdown("**限制说明**")
        st.markdown("- 最大文件: 10MB")
        st.markdown("- 最大尺寸: 8192x8192")
        st.markdown("- 支持格式: JPG, PNG, WebP")
    
    # 上传区域
    uploaded_file = st.file_uploader(
        "上传图片",
        type=["jpg", "jpeg", "png", "webp"],
        help="支持 JPG、PNG、WebP 格式，最大 10MB"
    )
    
    if uploaded_file:
        # 检查文件大小
        file_size = len(uploaded_file.getvalue())
        if file_size > MAX_FILE_SIZE:
            st.error(f"❌ 文件过大 ({file_size / 1024 / 1024:.1f}MB)，请上传小于 10MB 的图片")
            st.stop()
        
        # 加载图片
        image = Image.open(uploaded_file)
        
        # 显示原图
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📷 原图")
            st.image(image, use_container_width=True)
            st.caption(f"尺寸: {image.size[0]}x{image.size[1]} | 大小: {file_size / 1024:.1f}KB")
        
        # 翻译按钮
        if st.button("🚀 开始翻译", type="primary", use_container_width=True):
            with st.spinner("正在翻译中，请稍候..."):
                try:
                    translator = get_translator()
                    
                    # 解析语言设置
                    src = "auto" if source_lang == "自动检测" else LANGUAGES[source_lang]
                    tgt = LANGUAGES[target_lang]
                    fld = "e-commerce" if field == "电商图片" else "general"
                    
                    # 执行翻译（带后处理）
                    result = translator.translate(image, src, tgt, fld, enable_postprocess)
                    
                    # 保存到 session
                    st.session_state['result'] = result
                    st.session_state['translated'] = True
                    
                except Exception as e:
                    st.error(f"❌ 翻译失败: {str(e)}")
        
        # 显示结果
        if st.session_state.get('translated') and st.session_state.get('result'):
            with col2:
                st.subheader("✅ 翻译结果")
                result = st.session_state['result']
                st.image(result, use_container_width=True)
                
                # 下载按钮
                buffer = BytesIO()
                result.save(buffer, format='PNG')
                st.download_button(
                    label="📥 下载翻译结果",
                    data=buffer.getvalue(),
                    file_name="translated.png",
                    mime="image/png",
                    use_container_width=True
                )


if __name__ == "__main__":
    main()
