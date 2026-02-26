// --- 模块 1: 数据引擎 (Data Engine) ---
async function fetchSequence() {
    // 1.弹出输入框，让用户输入编号
    const accession = prompt('请输入NCBI序列编号（例如NM_000518）')
    if (!accession) { 
        return
    }else
    {
        executeFetch(accession)
    }
}
// 从NCBI拿取FASTA文件，提取DNA序列，进入analyzeDNA 同时讲accession存入saveToHistory
async function executeFetch(accession) {
    const btn = document.getElementById('fetch-btn');
    btn.innerText = "正在云端检索...";
     try {
        // 2.拼接NCBI的地址
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${accession}&rettype=fasta&retmode=text`;
        // 3. 发送请求
        const response = await fetch(url);
        if (!response.ok) throw new Error("找不到该编号或网络连接失败")
        const fastaText = await response.text();
        const cleanDNA = parseSequence(fastaText)
        if (cleanDNA) {
            document.getElementById('dna-input').value = cleanDNA.sequence
            document.getElementById('gene-name').innerText = cleanDNA.title
            analyzeDNA(cleanDNA.sequence)
            console.log("成功从 NCBI 获取数据！")
            // 下载成功后，存入本地，并刷新显示
            saveToHistory(accession)
        }
    } catch (err) {
        alert("获取失败，请手动输入序列");
    } finally {
        btn.innerText = "从 API 获取样本数据";
    }
}

// 解析FASTA文件数据
function parseSequence (rawContent) {
    const text = rawContent.trim()
    if (!text.startsWith('>')) {
    alert('请使用 FASTA 文件（第一行以 > 开头）');
    return ''}
    const lines =text.split(/\r?\n/)
    const title = lines[0].replace('>','')
    lines.shift()
    const sequence = lines.join('').replace(/[^ATGCUatgcu]/g, '').toUpperCase().replace(/U/g, 'T')
    return {title, sequence}
}
// --- 模块 1.2: 历史记录管理 --- 
function saveToHistory (accession) {
    // 1. 从本地获取现有记录 (一开始没有，所以获取的是空数组，直到被存储在)
    let history = JSON.parse(localStorage.getItem('dna_history') || '[]')
    // 不一样的保留，一样的就不要了
    history = history.filter(item => item !== accession)
    // 把搜索的这一个插到最前面
    history.unshift(accession)
    // 只要五个
    if(history.length > 5) history.pop()
    // set一个Item dna_history 存进去。
    localStorage.setItem('dna_history', JSON.stringify(history))
    renderHistory(history)
}
// 渲染界面
function renderHistory(history) {
    const historyList = document.getElementById('history-list')
    if (!historyList) return;
    // 先清空，再画新的
    historyList.innerHTML = ''
    if (history.length === 0) {
        historyList.innerHTML = '<span class="empty-hint">暂无记录</span>';
        return;
    }
    history.forEach(id => {
        const tag = document.createElement('span');
        tag.className = 'history-tag';
        tag.innerText = id;
        // 点击标签自动填入并抓取
        tag.addEventListener('click', () => {
            executeFetch(id)
        })
        // 把tag放入网页
        historyList.appendChild(tag)
    })
}
window.addEventListener('load',() => {
    const saved = JSON.parse(localStorage.getItem('dna_history') || '[]');
    renderHistory(saved)} )

// --- 模块 2.1: 数学逻辑 (Math Core) ---
function analyzeDNA(sequence) {
    const dna = sequence.toUpperCase().replace(/[^ATGC]/g, ''); // 清洗只数据：留 ATGC
    const len = dna.length;
    
    if (len === 0) return;

    // 使用高阶函数 reduce 统计碱基
    const counts = dna.split('').reduce((acc, base) => {
        acc[base] = (acc[base] || 0) + 1;
        return acc;
    }, { A: 0, T: 0, G: 0, C: 0 });
    // 计算 GC 含量：(G+C) / 总数
    const gcPercentage = ((counts.G + counts.C) / len * 100).toFixed(2);
    // 获取互补链
    const revComp = getReverseComplement(dna)
    // 更新界面
    updateUI(len, gcPercentage, counts,revComp);

    // 调用滑动窗口分析
    if (dna.length < 100) return
    const windowData = calculateSlidingWindow(dna, 100, 20);
    console.log("滑动窗口计算结果：", windowData)
    drawGCCanvas(windowData)
}
// 模块 2.2：反转互补链数学逻辑
function getReverseComplement(sequence){
    const lookup = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
    const reverse = sequence.toUpperCase().split('').reverse()
    const complement = reverse.map(base => lookup[base]||base).join('')
    return complement
}

// --- 模块 3: 可视化渲染 (Visual Renderer) ---
function updateUI(len, gc, counts,revComp) {
    // 1. 更新文字卡片
    document.getElementById('len-val').innerText = len;
    document.getElementById('gc-val').innerText = gc + "%";
    document.getElementById('rev-comp-val').innerText = revComp;

    // 2. 渲染动态柱状图
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // 先清空旧的

    Object.keys(counts).forEach((base, index) => {
    const count = counts[base];
    const heightPercent = (count / len * 100) * 2;

    const wrapper = document.createElement('div');
    wrapper.className = 'bar-wrapper';                                                     
    
    const delay = index * 0.3; // 延迟 0.3s 比较美观，3s 有点太慢啦

    // 【关键点】这里必须加上 id="bar-${base}"
    wrapper.innerHTML = `
        <div class="bar" id="bar-${base}" style="height: 0%; transition-delay: ${delay}s"></div>
        <div class="label">${base} (${count})</div>
    `;
    container.appendChild(wrapper);
    
    // 现在这里就能根据 id 找到那个柱子了
    setTimeout(() => {
        const bar = document.getElementById(`bar-${base}`);
        if (bar) {
            bar.style.height = heightPercent + '%'; 
        }
    }, 0); 
});
}
// --- 模块 4:滑动窗口算法 Canvas section ---
// @params {string} sequence 纯净的DNA序列
// @params {number} windowSize 窗口大小
// @params {number}step 每次向右滑动多少个碱基
// @return {number[]}- 返回一个

function calculateSlidingWindow (sequence, windowSize, step) {
    const gcValue = []
    for (let i = 0; i < sequence.length; i += step) {
        const windowSeq = sequence.slice(i, i + windowSize)
        let gcCount = 0;
        for(let char of windowSeq) {
            if(char === 'G' || char === 'C'){
                gcCount++
            }
        }
        const percent = (gcCount / windowSize) * 100
        gcValue.push(percent)
    }
    return gcValue
}
// 使用Canvas绘图
// @params {number[]} (就是上面calculateSlidingWindow返回的)
function drawGCCanvas (dataPoint) {
    const canvas = document.getElementById('gc-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const w = canvas.width;
    const h = canvas.height;
    // 如果没有数据，清空画布并退出
    if (dataPoint.length === 0) {
        ctx.clearRect(0, 0, w, h);
        return;
    }
    // 1.清除旧图
    ctx.clearRect (0, 0, w, h)
    // 2. 设置线条样式
    ctx.beginPath();
    ctx.strokeStyle = '#3a7bd5'
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    // 3.循环画点
    const stepX = w / (dataPoint.length - 1)
    dataPoint.forEach((val, i) => {
        const x = i * stepX
        // canvas的（0，0）在左上角，所以要用总高度减去比例高度
        const y = h - (val / 100 * h)

        if (i === 0) {
            ctx.moveTo(x, y)
        }else {
            ctx.lineTo(x, y)
        }
    })
    // 4.落笔
    ctx.stroke()
    // 5.下方来一个半透明的渐变（美丽）
    ctx.lineTo(w,h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(58, 123, 213, 0.1)';
    ctx.fill()
}
// --- 事件绑定 ---
// 点击分析事件
document.getElementById('analyze-btn').addEventListener('click',() =>{
const input = document.getElementById('dna-input').value;
    analyzeDNA(input);
})

// 互补链出现，以及复制弹窗
document.getElementById('copy-btn').addEventListener('click', () => {
    const text = document.getElementById('rev-comp-val').innerText;
    if (text === '-') return;
    navigator.clipboard.writeText(text).then(() => {
        alert("互补链已复制到剪贴板！");
    });
})
// 点击事件进行数据获取
document.getElementById('fetch-btn').addEventListener('click',fetchSequence);
// 点击事件，触发隐藏的file input
document.getElementById('upload-trigger').addEventListener('click', () => {
    document.getElementById('file-input').click()
})
// FASTA文件上传事件
document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0]
    if(!file) return
    // 创建文件读取器
    const reader = new FileReader()
    reader.addEventListener('load', function(event) {
        const fullText = event.target.result
        const cleanDNA = parseSequence(fullText)
        if(cleanDNA) {
            document.getElementById('gene-name').innerText = cleanDNA.title;
            document.getElementById('dna-input').value = cleanDNA.sequence;
            analyzeDNA(cleanDNA.sequence)
        }
    })
    reader.addEventListener('error', () => {
        alert ('文件读取出错')
    })
    reader.readAsText(file)
    e.target.value = ''
})
