<template>
  <div class="explanation-text">
    <span>关于加权平均分计算器的说明</span><br>

    <span data-number="1.">计算通过以下公式实现</span><br>
    <span>\[\frac{\sum (成绩 \times 学分)}{\sum 学分}\]</span><br>
    <span data-number="2.">由于每个同学的选修课不尽相同，在这里仅录入必修课数据，专业选修课，通识教育，自主课程等自选的课程数据需要自行添加</span><br>
    <span data-number="3.">学期和课程名称不是必填项</span><br>
    <span data-number="4.">由于各个专业课程数据由作者手动录入，可能存在错误，请自行核对修改</span><br>
    <span data-number="5.">学校专业较多，由于时间原因只录入了少数部分专业数据，若没有你的专业，可登录教务处网站
        <a href="https://undergrad.bjut.edu.cn/content.jsp?urltype=news.NewsContentUrl&wbtreeid=1045&wbnewsid=2165">https://undergrad.bjut.edu.cn/content.jsp?urltype=news.NewsContentUrl&wbtreeid=1045&wbnewsid=2165</a>
        查询你的专业对应数据；在填写完毕后欢迎导出数据文件并贡献以方便其他同学使用（仅录入公共基础必修课，学科基础必修课，实践环节必修课，学科基础选修课即可）</span><br>
    <span data-number="6.">由于作者水平有限，程序可能存在错误，欢迎在 GitHub 上提交 issue <a href="https://github.com/hjxdio/hjxdio.github.io/issues/" target="_blank" rel="noopener">
        在 GitHub 上提交问题
      </a></span><br>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
    // MathJax加载
    if (window.MathJax) {
        window.MathJax.typeset()
    } else {
        window.addEventListener('load', () => {
            window.MathJax?.typeset()
        })
    }
})

</script>

<style scoped>
.explanation-text {
    font-family: "宋体", SimSun, serif;
  font-size: 16px;
}

.explanation-text span:first-child {
  font-size: 18px;
  font-weight: bold;
}

.explanation-text span:nth-child(n+3):before {  
  content: attr(data-number);
  font-weight: bold;
  color: #2c3e50;
  margin-right: 5px;
}
</style>