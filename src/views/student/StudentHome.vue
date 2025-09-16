<template>
  <div class="page">
    <!-- 顶部标题横幅（参考课本风格） -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">算法中的数据</h1>
      </div>
    </div>

    <!-- 你将学习（参考书本风格的浅色框） -->
    <section class="learn-box">
      <div class="learn-title">你将学习</div>
      <ol class="learn-list">
        <li>算法的有穷性。</li>
        <li>算法的确定性。</li>
        <li>算法要有输出。</li>
      </ol>
    </section>

    <div class="section-title">讨论</div>
    <!-- 学生内容区：通过子路由切换（question1/activity1/chat） -->
    <router-view />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}
.banner {
  background: linear-gradient(180deg, #4ea3f9 0%, #6cc2ff 60%, #e9f6ff 100%);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  margin-bottom: 16px;
  color: #0b3a6d;
}
.banner-inner { display: flex; align-items: center; gap: 14px; }
.banner-badge {
  background: #fff;
  color: #2d6cb3;
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
}
.learn-box {
  background: #f7fbff;
  border: 1px dashed #cfe8ff;
  border-radius: 12px;
  padding: 14px 16px;
  margin: 16px 0 12px;
}
.learn-title {
  display: inline-block;
  background: #e9f6ff;
  border-radius: 10px;
  padding: 4px 10px;
  color: #2b6aa6;
  font-weight: 700;
  margin-bottom: 8px;
}
.learn-list { margin: 8px 0 0 18px; color: #2b2b2b; }
.learn-list li { margin: 4px 0; }
.section-title {
  margin: 10px 0 8px;
  color: #2b6aa6;
  font-weight: 700;
}
.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.img-wrap {
  width: 100%;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}
.img-wrap img {
  max-width: 420px; /* 缩小图片尺寸 */
  border-radius: 8px;
}
.draw-wrap { position: relative; }
.draw-layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  /* 宽高在syncCanvasSize里动态设置，与图片一致 */
  pointer-events: auto;
}
.draw-actions { display: flex; gap: 8px; margin: 6px 0 10px; }
.prompt {
  margin: 8px 0 12px;
  color: #333;
}
.actions { margin-top: 8px; }
</style>
