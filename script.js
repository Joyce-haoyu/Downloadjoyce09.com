// 修改为你的实际仓库配置
const CONFIG = {
    user: 'joyce-haoyu',
    repo: 'downloadjoyce09.com' // 确认你的仓库名叫什么，按需修改
};

async function openCategory(folderName) {
    document.getElementById('home-view').classList.remove('active');
    document.getElementById('list-view').classList.add('active');
    
    const titles = {
        'software': '软件资源',
        'gallery': '相册图库',
        'video': '视频精选'
    };
    document.getElementById('category-title').innerText = titles[folderName];
    
    await loadGitHubFiles(folderName);
}

function goBack() {
    document.getElementById('list-view').classList.remove('active');
    document.getElementById('home-view').classList.add('active');
}

async function loadGitHubFiles(path) {
    const container = document.getElementById('content-grid');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;">正在同步 Joyce 的云端数据...</div>';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${path}`);
        const data = await res.json();
        
        container.innerHTML = '';
        let count = 0;
        
        for (const item of data) {
            if (item.type === 'file') {
                count++;
                // 核心：截取文件名 '.' 前面的部分作为标题
                const displayName = item.name.split('.')[0];
                
                let finalUrl = item.download_url;
                
                // 【分类1：软件处理】如果是 txt，读取里面的直链
                if (path === 'software') {
                    if (item.name.endsWith('.txt') || item.name.endsWith('.html')) {
                        const contentRes = await fetch(item.download_url);
                        finalUrl = (await contentRes.text()).trim();
                    }
                    container.innerHTML += `
                        <a href="${finalUrl}" class="file-item" target="_blank">
                            <div style="font-size:45px; margin-bottom:15px;">📦</div>
                            <div class="item-title">${displayName}</div>
                            <div class="item-action">点击下载 ⬇️</div>
                        </a>
                    `;
                } 
                // 【分类2：相册处理】直接显示图片
                else if (path === 'gallery') {
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(item.name);
                    let preview = `<div style="font-size:45px; margin-bottom:15px;">📄</div>`;
                    if (isImage) preview = `<img src="${item.download_url}">`;
                    
                    container.innerHTML += `
                        <a href="${item.download_url}" class="file-item" target="_blank">
                            ${preview}
                            <div style="font-size:12px; color:#aaa;">${item.name}</div>
                        </a>
                    `;
                }
                // 【分类3：视频处理】读取 txt 中的蓝奏云链接
                else if (path === 'video') {
                    if (item.name.endsWith('.txt')) {
                        const contentRes = await fetch(item.download_url);
                        finalUrl = (await contentRes.text()).trim();
                    }
                    container.innerHTML += `
                        <a href="${finalUrl}" class="file-item" target="_blank">
                            <div style="font-size:45px; margin-bottom:15px;">📺</div>
                            <div class="item-title">${displayName}</div>
                            <div class="item-action" style="color: #60a5fa;">前往蓝奏云观看 ↗</div>
                        </a>
                    `;
                }
            }
        }
        
        if (count === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px;">该目录下暂无内容。</div>';
        }
    } catch (err) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#ff6b6b;">读取失败，请检查网络或 GitHub 仓库设置。</div>';
    }
}
