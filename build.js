const fs = require('fs');
const path = require('path');

const PPTS_DIR = './ppts';
const OUTPUT_FILE = './index.html';

// 解析文件名: [分类]标题.html -> { category, title, filename }
function parseFileName(filename) {
  const match = filename.match(/^\[(.+?)\](.+)\.html$/);
  if (match) {
    return { category: match[1], title: match[2], filename };
  }
  // 没有分类前缀的文件归入"未分类"
  const titleMatch = filename.match(/^(.+)\.html$/);
  if (titleMatch) {
    return { category: '未分类', title: titleMatch[1], filename };
  }
  return null;
}

// 扫描PPT文件
function scanPPTs() {
  if (!fs.existsSync(PPTS_DIR)) {
    console.log(`Creating ${PPTS_DIR} directory...`);
    fs.mkdirSync(PPTS_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(PPTS_DIR);
  const ppts = [];

  for (const file of files) {
    if (file.endsWith('.html')) {
      const parsed = parseFileName(file);
      if (parsed) {
        ppts.push(parsed);
      }
    }
  }

  return ppts.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}

// 生成HTML
function generateHTML(ppts) {
  const categories = [...new Set(ppts.map(p => p.category))].sort();

  const pptListHTML = ppts.map(ppt =>
    `<li class="ppt-item" data-category="${ppt.category}" data-title="${ppt.title}">
      <a href="ppts/${encodeURIComponent(ppt.filename)}" target="_blank">
        <div class="ppt-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-6 4h4"/>
          </svg>
        </div>
        <div class="ppt-info">
          <div class="ppt-title">${ppt.title}</div>
          <span class="ppt-category">${ppt.category}</span>
        </div>
        <svg class="ppt-arrow" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>
    </li>`
  ).join('\n      ');

  const categoryButtonsHTML = categories.map(cat =>
    `<button class="category-btn" data-category="${cat}">${cat}</button>`
  ).join('\n        ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPT Gallery</title>
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-primary: #f5f5f7;
      --bg-secondary: rgba(255, 255, 255, 0.72);
      --bg-tertiary: rgba(255, 255, 255, 0.9);
      --text-primary: #1d1d1f;
      --text-secondary: #86868b;
      --accent: #0071e3;
      --accent-hover: #0077ed;
      --border: rgba(0, 0, 0, 0.04);
      --shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      --shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.12);
      --radius-lg: 20px;
      --radius-md: 14px;
      --radius-sm: 10px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.47059;
      font-weight: 400;
      letter-spacing: -0.022em;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }

    .container {
      max-width: 980px;
      margin: 0 auto;
      padding: 60px 24px;
    }

    /* Header Section */
    .header-section {
      text-align: center;
      margin-bottom: 48px;
    }

    h1 {
      font-size: 48px;
      font-weight: 600;
      letter-spacing: -0.003em;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #1d1d1f 0%, #424245 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      font-size: 21px;
      color: var(--text-secondary);
      font-weight: 400;
    }

    /* Search & Filter Card */
    .filter-card {
      background: var(--bg-secondary);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      margin-bottom: 32px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .search-wrapper {
      position: relative;
      margin-bottom: 20px;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
    }

    .search-box {
      width: 100%;
      padding: 14px 16px 14px 48px;
      font-size: 17px;
      font-family: inherit;
      border: none;
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
    }

    .search-box::placeholder { color: var(--text-secondary); }
    .search-box:focus {
      outline: none;
      box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 4px rgba(0, 113, 227, 0.1);
    }

    .categories {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .category-btn {
      padding: 8px 18px;
      border: none;
      border-radius: 980px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .category-btn:hover {
      background: #e8e8ed;
      transform: scale(1.02);
    }

    .category-btn.active {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
    }

    .stats {
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    .stats span { font-weight: 600; color: var(--text-primary); }

    /* PPT List */
    .ppt-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ppt-item {
      background: var(--bg-secondary);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .ppt-item:hover {
      transform: translateY(-2px) scale(1.005);
      box-shadow: var(--shadow-hover);
      border-color: rgba(0, 0, 0, 0.08);
    }

    .ppt-item a {
      display: flex;
      align-items: center;
      padding: 18px 24px;
      text-decoration: none;
      color: inherit;
      gap: 16px;
    }

    .ppt-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
    }

    .ppt-icon svg {
      width: 22px;
      height: 22px;
      color: #fff;
    }

    .ppt-info {
      flex: 1;
      min-width: 0;
    }

    .ppt-title {
      font-size: 17px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ppt-category {
      display: inline-block;
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .ppt-arrow {
      color: var(--text-secondary);
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .ppt-item:hover .ppt-arrow {
      opacity: 1;
      transform: translateX(0);
      color: var(--accent);
    }

    .ppt-item.hidden { display: none; }

    .empty-message {
      text-align: center;
      padding: 80px 40px;
      color: var(--text-secondary);
      font-size: 17px;
      background: var(--bg-secondary);
      backdrop-filter: saturate(180%) blur(20px);
      border-radius: var(--radius-lg);
    }

    /* Responsive */
    @media (max-width: 734px) {
      .container { padding: 40px 20px; }
      h1 { font-size: 32px; }
      .subtitle { font-size: 17px; }
      .filter-card { padding: 20px; }
      .ppt-item a { padding: 14px 18px; }
      .ppt-icon { width: 40px; height: 40px; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #000;
        --bg-secondary: rgba(28, 28, 30, 0.72);
        --bg-tertiary: rgba(44, 44, 46, 0.9);
        --text-primary: #f5f5f7;
        --text-secondary: #86868b;
        --border: rgba(255, 255, 255, 0.08);
      }
      h1 {
        background: linear-gradient(135deg, #f5f5f7 0%, #a1a1a6 100%);
        -webkit-background-clip: text;
        background-clip: text;
      }
      .category-btn:hover { background: #3a3a3c; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-section">
      <h1>PPT Gallery</h1>
      <p class="subtitle">共收录 ${ppts.length} 份精选演示文稿</p>
    </div>

    <div class="filter-card">
      <div class="search-wrapper">
        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" class="search-box" placeholder="搜索演示文稿..." id="search">
      </div>
      <div class="categories">
        <button class="category-btn active" data-category="all">全部</button>
        ${categoryButtonsHTML}
      </div>
      <div class="stats">
        显示 <span id="visible">${ppts.length}</span> / <span id="total">${ppts.length}</span> 个文件
      </div>
    </div>

    <ul class="ppt-list" id="ppt-list">
      ${pptListHTML}
    </ul>

    ${ppts.length === 0 ? '<div class="empty-message">暂无演示文稿<br><small style="opacity:0.7">请将 [分类]标题.html 格式的文件放入 ppts/ 目录</small></div>' : ''}
  </div>

  <script>
    const items = document.querySelectorAll('.ppt-item');
    const searchInput = document.getElementById('search');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const visibleCount = document.getElementById('visible');

    let currentCategory = 'all';

    function filter() {
      const keyword = searchInput.value.toLowerCase();
      let count = 0;

      items.forEach(item => {
        const category = item.dataset.category;
        const title = item.dataset.title.toLowerCase();
        const matchCategory = currentCategory === 'all' || category === currentCategory;
        const matchSearch = !keyword || title.includes(keyword) || category.toLowerCase().includes(keyword);

        if (matchCategory && matchSearch) {
          item.classList.remove('hidden');
          count++;
        } else {
          item.classList.add('hidden');
        }
      });

      visibleCount.textContent = count;
    }

    searchInput.addEventListener('input', filter);

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filter();
      });
    });
  </script>
</body>
</html>`;
}

// 主函数
function build() {
  console.log('Scanning PPT files...');
  const ppts = scanPPTs();
  console.log(`Found ${ppts.length} PPT files`);

  const categories = [...new Set(ppts.map(p => p.category))];
  console.log(`Categories: ${categories.join(', ') || 'none'}`);

  console.log('Generating index.html...');
  const html = generateHTML(ppts);
  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  console.log(`Done! Generated ${OUTPUT_FILE}`);
}

build();
