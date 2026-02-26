// 模块 1:数据引擎 （Data engine)
async function fetchSequence () {
    const btn = document.querySelector('fetch-btn')
    btn.innerText = '读取中。。。'
    try {
        // 模拟从生物数据库获取数据 （这里用一个演示 API
        const response = await fetch ('https://www.ncbi.nlm.nih.gov/');
        // 实际上我们会处理真是的FASTA 格式，现在我们先模拟一段随机的DNA
        const mockDNA = "ATGCGATCGATTAGCTAGCTAGCTAGCTAGGGATTTACGATCGATCGATCGATCGA";

        document.querySelector('dna-input').value = mokDNA
        
    } catch (err){
        alert ('获取失败，请手动输入序列')
    } finally {
        btn.innerText = "从 API 获取样本数据";
    }

}