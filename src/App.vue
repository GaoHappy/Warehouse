<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
@font-face {
  font-family: "HanYiQiHei";
  src: url("@/assets/fonts/han-yi-qi-hei.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "HanYiYaKuHei";
  src: url("@/assets/fonts/han-yi-ya-ku-hei.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "HanYiQiHei", "PingFang SC", "Microsoft YaHei", sans-serif;
}
</style>