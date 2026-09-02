<template>
  <HudPanel title="任务统计" width="280px">
    <div class="task-status">
      <div class="task-row">
        <div class="task-row__label">搬运任务</div>
        <div class="task-bars">
          <div class="task-bar-item create">
            <span class="bar-val">{{ data.HandleCreateCount }}</span>
            <span class="bar-label">创建</span>
          </div>
          <div class="task-bar-item active">
            <span class="bar-val">{{ data.HandleActiveCount }}</span>
            <span class="bar-label">进行中</span>
          </div>
          <div class="task-bar-item complete">
            <span class="bar-val">{{ data.HandleCompleteCount }}</span>
            <span class="bar-label">完成</span>
          </div>
        </div>
      </div>
      <div class="task-row">
        <div class="task-row__label">输送任务</div>
        <div class="task-bars">
          <div class="task-bar-item create">
            <span class="bar-val">{{ data.ConveyCreateCount }}</span>
            <span class="bar-label">创建</span>
          </div>
          <div class="task-bar-item active">
            <span class="bar-val">{{ data.ConveyActiveCount }}</span>
            <span class="bar-label">进行中</span>
          </div>
          <div class="task-bar-item complete">
            <span class="bar-val">{{ data.ConveyCompleteCount }}</span>
            <span class="bar-label">完成</span>
          </div>
        </div>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import HudPanel from "./HudPanel.vue";

interface TaskStatusData {
  HandleCreateCount: number;
  HandleActiveCount: number;
  HandleCompleteCount: number;
  ConveyCreateCount: number;
  ConveyActiveCount: number;
  ConveyCompleteCount: number;
}

defineProps<{
  data: TaskStatusData;
}>();
</script>

<style scoped>
.task-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-row__label {
  font-size: 11px;
  color: rgba(0, 200, 255, 0.6);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
  padding-left: 2px;
}

.task-bars {
  display: flex;
  gap: 4px;
}

.task-bar-item {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  border-radius: 2px;
  background: rgba(0, 100, 150, 0.12);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bar-val {
  font-size: 22px;
  font-weight: 700;
  font-family: "SF Mono", "JetBrains Mono", monospace;
  line-height: 1;
}

.bar-label {
  font-size: 10px;
  color: rgba(160, 200, 220, 0.6);
  letter-spacing: 0.04em;
}

.task-bar-item.create .bar-val {
  color: #ffd740;
}
.task-bar-item.active .bar-val {
  color: #40c4ff;
}
.task-bar-item.complete .bar-val {
  color: #00e676;
}
</style>