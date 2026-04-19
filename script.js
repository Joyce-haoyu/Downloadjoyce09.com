const CONFIG = {
    user: 'joyce-haoyu',
    repo: 'downloadjoyce09.com'
};

// 切换到文件夹视图
async function enterFolder(folderName) {
    const homeView = document.getElementById('home-view');
    const folderView = document.getElementById('folder-view');
    const titleText = document.getElementById('folder-title-text');
    
    titleText.innerText = folderName === 'software' ? '软件资源' : '图库预览';
    
    homeView.classList.remove('active');
    folderView.classList.add('active');
    
    await loadGitHubFiles(folderName);
}

// 返回首页
function exitFolder() {
    document.getElementById('folder-view').classList.remove('active');
    document.getElementById('home-view').classList.add('active');
}

// 自动扫描 GitHub 仓库对应文件夹
async function loadGitHubFiles(path) {
    const container = document.getElementById('file-list');
    container.innerHTML = '<p>正在同步 Joyce 的最新资源...</p>';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${path}`);
        const data = await res.json();
        
        container.innerHTML = '';
        
        data.forEach(item => {
            if (item.type === 'file') {
                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(item.name);
                const isVideo = /\.(mp4|mov)$/i.test(item.name);
                
                let preview = `<div style="font-size:40px; margin-bottom:10px;">📄</div>`;
                if (isImage) preview = `<img src="${item.download_url}">`;
                if (isVideo) preview = `<video src="${item.download_url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;

                const card = document.createElement('a');
                card.className = 'file-item';
                card.href = item.download_url;
                card.setAttribute('download', '');
                card.innerHTML = `
                    ${preview}
                    <div style="font-size:14px; word-break:break-all;">${item.name}</div>
                `;
                container.appendChild(card);
            }
        });
    } catch (err) {
        container.innerHTML = '<p>连接失败，请检查网络或 GitHub 仓库设置。</p>';
    }
}
