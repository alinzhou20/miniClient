<template>

</template>

<script setup lang="ts">

</script>

<style scoped>
.page {
  padding: 20px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
  min-height: 100vh;
}

.activity-header {
  margin-bottom: 20px;
  text-align: center;
}

.activity-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.activity-description {
  color: #6b7280;
  font-size: 16px;
}

.stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #6b7280;
}

.value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
}

.value.submitted {
  color: #10b981;
}

.value.pending {
  color: #f59e0b;
}

.divider {
  color: #d1d5db;
  font-size: 20px;
}

.battle-section,
.empty-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
  text-align: center;
}

.battle-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: start;
}

.viewpoint-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-header {
  background: linear-gradient(135deg, #f9fafb, #ffffff);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid #e5e7eb;
}

.side-a .side-header {
  border-color: #fca5a5;
  background: linear-gradient(135deg, #fee2e2, #ffffff);
}

.side-b .side-header {
  border-color: #93c5fd;
  background: linear-gradient(135deg, #dbeafe, #ffffff);
}

.side-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
}

.badge-a {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.badge-b {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.side-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.side-count {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.vs-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
  border: 4px solid white;
}

.vs-text {
  font-size: 28px;
  font-weight: 900;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 800px;
  overflow-y: auto;
  padding-right: 8px;
}

.submissions-list::-webkit-scrollbar {
  width: 6px;
}

.submissions-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.submissions-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.submissions-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.submission-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-a {
  border-color: #fca5a5;
}

.card-b {
  border-color: #93c5fd;
}

.submission-card:hover {
  transform: translateX(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.card-a:hover {
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
}

.card-b:hover {
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
}

.empty-side {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}

.card-header {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-badge {
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.vp-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.vp-badge.vp-a {
  background: #ef4444;
}

.vp-badge.vp-b {
  background: #3b82f6;
}

.time {
  font-size: 12px;
  color: #6b7280;
}

.img-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%;
  cursor: pointer;
  overflow: hidden;
}

.img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  opacity: 0;
  transition: all 0.3s ease;
}

.img-wrapper:hover .overlay {
  background: rgba(0, 0, 0, 0.6);
  opacity: 1;
}

.zoom-icon {
  font-size: 32px;
}

.info {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.info .label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.ratings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rating {
  background: #fef3c7;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  color: #92400e;
  font-weight: 600;
}

.recognition-content {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  color: #0c4a6e;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #bae6fd;
}

.empty {
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-hint {
  margin-top: 8px;
  font-size: 14px;
  color: #9ca3af;
}

.unsubmitted {
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 12px;
  margin-top: 24px;
}

.unsubmitted .header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 12px;
}

.unsubmitted .list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: #fbbf24;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.preview {
  display: flex;
  justify-content: center;
  background: #1f2937;
  border-radius: 8px;
}

.preview-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

@media (max-width: 1200px) {
  .battle-arena {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .vs-divider {
    order: 1;
    padding: 0;
  }
  
  .side-a {
    order: 0;
  }
  
  .side-b {
    order: 2;
  }
  
  .vs-circle {
    transform: rotate(90deg);
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .stats {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .side-header {
    padding: 16px;
  }
  
  .submissions-list {
    max-height: 600px;
  }
}
</style>
