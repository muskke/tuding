const { ipcRenderer } = require('electron');

class TudingCanvas {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.itemCount = document.getElementById('itemCount');
        this.canvasItems = [];
        
        this.initEventListeners();
        this.loadCanvasContent();
        this.updateItemCount();
    }

    initEventListeners() {
        // 窗口控制按钮
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelpDialog();
        });

        document.getElementById('minimizeBtn').addEventListener('click', async () => {
            try {
                await ipcRenderer.invoke('minimize-window');
            } catch (error) {
                console.error('最小化失败:', error);
            }
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
        });

        document.getElementById('closeBtn').addEventListener('click', async () => {
            try {
                await ipcRenderer.invoke('close-window');
            } catch (error) {
                console.error('关闭失败:', error);
            }
        });

        // 为关闭按钮添加右键菜单
        document.getElementById('closeBtn').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showCloseMenu(e);
        });

        // 画布点击事件
        this.canvas.addEventListener('click', () => {
            this.canvas.classList.add('active');
            this.canvas.focus();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                this.pasteFromClipboard();
            }
        });

        // IPC 事件监听
        ipcRenderer.on('paste-content', (event, content) => {
            this.addContent(content);
        });

        // 失去焦点时移除active状态
        document.addEventListener('click', (e) => {
            if (!this.canvas.contains(e.target)) {
                this.canvas.classList.remove('active');
            }
        });
    }

    async pasteFromClipboard() {
        try {
            const content = await ipcRenderer.invoke('get-clipboard-content');
            this.addContent(content);
        } catch (error) {
            console.error('粘贴失败:', error);
        }
    }

    addContent(content) {
        if (!content || content.type === 'empty' || !content.data) {
            return;
        }

        const item = {
            id: Date.now(),
            type: content.type,
            data: content.data,
            timestamp: new Date().toLocaleString('zh-CN')
        };

        this.canvasItems.unshift(item);
        this.renderCanvas();
        this.saveCanvasContent();
        this.updateItemCount();

        // 移除欢迎消息
        const welcomeMessage = this.canvas.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
    }

    renderCanvas() {
        // 清空画布但保留欢迎消息
        const welcomeMessage = this.canvas.querySelector('.welcome-message');
        this.canvas.innerHTML = '';
        
        if (this.canvasItems.length === 0 && welcomeMessage) {
            this.canvas.appendChild(welcomeMessage);
            return;
        }

        this.canvasItems.forEach(item => {
            const itemElement = this.createItemElement(item);
            this.canvas.appendChild(itemElement);
        });
    }

    createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'canvas-item';
        itemDiv.dataset.id = item.id;

        const header = document.createElement('div');
        header.className = 'item-header';
        
        const typeSpan = document.createElement('span');
        typeSpan.className = 'item-type';
        typeSpan.textContent = this.getTypeLabel(item.type);
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'item-time';
        timeSpan.textContent = item.timestamp;
        
        header.appendChild(typeSpan);
        header.appendChild(timeSpan);

        const content = document.createElement('div');
        content.className = `item-content ${item.type}`;
        
        switch (item.type) {
            case 'text':
                content.textContent = item.data;
                break;
            case 'html':
                content.innerHTML = item.data;
                break;
            case 'image':
                const img = document.createElement('img');
                img.src = item.data;
                img.alt = '粘贴的图片';
                content.appendChild(img);
                break;
        }

        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
            this.removeItem(item.id);
        });
        
        actions.appendChild(deleteBtn);

        itemDiv.appendChild(header);
        itemDiv.appendChild(content);
        itemDiv.appendChild(actions);

        return itemDiv;
    }

    getTypeLabel(type) {
        const labels = {
            'text': '文本',
            'html': 'HTML',
            'image': '图片'
        };
        return labels[type] || type;
    }

    removeItem(id) {
        this.canvasItems = this.canvasItems.filter(item => item.id !== id);
        this.renderCanvas();
        this.saveCanvasContent();
        this.updateItemCount();

        // 如果没有内容了，显示欢迎消息
        if (this.canvasItems.length === 0) {
            this.showWelcomeMessage();
        }
    }

    showWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <p>欢迎使用图钉！</p>
            <p>点击此处，然后按 <kbd>Ctrl+V</kbd> 粘贴内容</p>
            <p>或使用 <kbd>Ctrl+Shift+V</kbd> 全局粘贴</p>
        `;
        this.canvas.appendChild(welcomeDiv);
    }

    async clearCanvas() {
        if (this.canvasItems.length === 0) return;
        
        if (confirm('确定要清空所有内容吗？')) {
            this.canvasItems = [];
            this.canvas.innerHTML = '';
            this.showWelcomeMessage();
            this.updateItemCount();
            await ipcRenderer.invoke('clear-canvas');
        }
    }

    async saveCanvasContent() {
        try {
            await ipcRenderer.invoke('save-canvas-content', this.canvasItems);
        } catch (error) {
            console.error('保存失败:', error);
        }
    }

    async loadCanvasContent() {
        try {
            const content = await ipcRenderer.invoke('load-canvas-content');
            this.canvasItems = content || [];
            this.renderCanvas();
        } catch (error) {
            console.error('加载失败:', error);
        }
    }

    updateItemCount() {
        this.itemCount.textContent = `内容数量: ${this.canvasItems.length}`;
    }

    showCloseMenu(event) {
        // 移除之前的菜单
        const existingMenu = document.querySelector('.close-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'close-menu';
        menu.innerHTML = `
            <div class="close-menu-item" data-action="hide">隐藏到托盘</div>
            <div class="close-menu-item" data-action="quit">完全退出</div>
        `;

        // 设置菜单位置
        menu.style.position = 'fixed';
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX - 80}px`;
        menu.style.zIndex = '9999';

        document.body.appendChild(menu);

        // 添加菜单项点击事件
        menu.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            if (action === 'hide') {
                await ipcRenderer.invoke('close-window');
            } else if (action === 'quit') {
                await ipcRenderer.invoke('quit-app');
            }
            menu.remove();
        });

        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenuHandler() {
                menu.remove();
                document.removeEventListener('click', closeMenuHandler);
            });
        }, 0);
    }

    async showHelpDialog() {
        const paths = await ipcRenderer.invoke('get-app-data-path');
        
        const dialog = document.createElement('div');
        dialog.className = 'help-dialog';
        dialog.innerHTML = `
            <div class="help-content">
                <h3>📌 图钉 - 帮助信息</h3>
                <div class="help-section">
                    <h4>快捷键</h4>
                    <ul>
                        <li><kbd>Ctrl+Shift+V</kbd> - 全局粘贴</li>
                        <li><kbd>Ctrl+Shift+T</kbd> - 显示/隐藏窗口</li>
                        <li><kbd>Ctrl+V</kbd> - 在画布内粘贴</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>数据存储</h4>
                    <p>您的数据存储在：</p>
                    <code>${paths.userData}</code>
                    <button class="data-btn" onclick="this.showDataOptions()">数据管理</button>
                </div>
                <div class="help-section">
                    <h4>版本信息</h4>
                    <p>版本：1.0.0</p>
                    <p>基于 Electron 开发</p>
                </div>
                <div class="help-actions">
                    <button class="help-close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加数据管理功能
        dialog.querySelector('.data-btn').onclick = () => {
            this.showDataOptions();
        };
    }

    async showDataOptions() {
        const dialog = document.createElement('div');
        dialog.className = 'data-dialog';
        dialog.innerHTML = `
            <div class="data-content">
                <h3>🗂️ 数据管理</h3>
                <p>选择要执行的操作：</p>
                <div class="data-actions">
                    <button class="data-action-btn" data-action="clear">清空所有数据</button>
                    <button class="data-action-btn cancel" onclick="this.parentElement.parentElement.parentElement.remove()">取消</button>
                </div>
                <div class="data-warning">
                    <small>⚠️ 清空数据后无法恢复，请谨慎操作</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'clear') {
                if (confirm('确定要清空所有数据吗？此操作无法撤销！')) {
                    const result = await ipcRenderer.invoke('clear-all-data');
                    if (result.success) {
                        this.canvasItems = [];
                        this.renderCanvas();
                        this.showWelcomeMessage();
                        this.updateItemCount();
                        alert('数据已清空！');
                    } else {
                        alert('清空失败：' + result.error);
                    }
                }
                dialog.remove();
            }
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TudingCanvas();
});