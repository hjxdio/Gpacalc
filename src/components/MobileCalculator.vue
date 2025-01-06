<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Delete, Upload, Download, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ExplanationBox from './ExplanationBox.vue'
import UploadBox from './UploadJson.vue'
import { type Subject, type ExistingGPA, majors, validateSubjectData, calculateWeightedAverage, calculateTotalCredits } from '../types/calculator'

const subjects = ref<Subject[]>([
  { id: 1, name: '', credit: 0, score: 0, semester: '', selected: true }
])

const nextId = ref(2)
const showExplanation = ref(false)
const showUpload = ref(false)
const selectedMajor = ref('')

const existingGPA = ref<ExistingGPA>({
  score: 0,
  credits: 0
})

const weightedAverage = computed(() => calculateWeightedAverage(subjects.value, existingGPA.value))
const totalCredits = computed(() => calculateTotalCredits(subjects.value, existingGPA.value))

const addSubject = () => {
  subjects.value.push({
    id: nextId.value++,
    name: '',
    credit: 0,
    score: 0,
    semester: '',
    selected: true
  })
}

const removeSubject = (index: number) => {
  if (subjects.value.length > 1) {
    subjects.value.splice(index, 1)
  }
}

const handleFileImport = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)
      
      if (!Array.isArray(data.subjects) || !data.nextId) {
        throw new Error('Invalid file format')
      }

      if (!data.subjects.every(validateSubjectData)) {
        throw new Error('Invalid subject data format')
      }

      data.subjects.forEach((subject: Subject) => {
        subject.selected = true
      })

      subjects.value = data.subjects
      nextId.value = data.nextId
      
      if (data.existingGPA) {
        existingGPA.value = data.existingGPA
      }
      
      ElMessage.success('导入成功')
    } catch (error) {
      ElMessage.error('文件格式错误，请确保导入正确的成绩数据文件')
    }
  }

  reader.readAsText(file)
  input.value = ''
}

const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  fileInputRef.value?.click()
}

const showExplanationModel = () => {
  showExplanation.value = true
}

const showUploadDialog = () => {
  showUpload.value = true
}

const exportData = () => {
  const exportSubjects = subjects.value.map(({ selected, ...rest }) => rest)
  const data = {
    subjects: exportSubjects,
    nextId: nextId.value,
    existingGPA: existingGPA.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `grades-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const loadMajorData = async (majorFile: string) => {
  try {
    const response = await fetch(`/majors/${majorFile}`)
    const data = await response.json()
    
    if (!Array.isArray(data.subjects) || !data.nextId) {
      throw new Error('Invalid major data format')
    }

    const subjectsWithSelection = data.subjects.map((subject: any) => ({
      ...subject,
      selected: true
    }))

    subjectsWithSelection.sort((a: { semester: string }, b: { semester: any }) => a.semester.localeCompare(b.semester))

    subjects.value = subjectsWithSelection
    nextId.value = data.nextId
    ElMessage.success('专业课程加载成功')
  } catch (error) {
    ElMessage.error('加载专业课程失败')
    console.error(error)
  }
}

watch(selectedMajor, (newValue) => {
  if (newValue) {
    const major = majors.find(m => m.value === newValue)
    if (major) {
      loadMajorData(major.file)
    }
  }
})

const semesters = computed(() => {
  const semesterSet = new Set(subjects.value.map(s => s.semester).filter(s => s.trim() !== ''))
  return Array.from(semesterSet).sort()
})

const selectedSemester = ref('')

const toggleSemesterSelection = (semester: string, selected: boolean) => {
  subjects.value.forEach(subject => {
    if (subject.semester === semester) {
      subject.selected = selected
    }
  })
}

const shouldShowDivider = (currentIndex: number) => {
  if (currentIndex === 0) {
    return subjects.value[0].semester !== ''
  }
  const currentSemester = subjects.value[currentIndex].semester
  const prevSemester = subjects.value[currentIndex - 1].semester
  return currentSemester !== prevSemester && currentSemester !== '' && prevSemester !== ''
}

const getDividerText = (index: number) => {
  return subjects.value[index].semester
}
</script>

<template>
  <el-dialog
    v-model="showExplanation"
    title="说明"
    width="90%"
  >
    <ExplanationBox />
  </el-dialog>

  <el-dialog
    v-model="showUpload"
    title="贡献专业学科数据"
    width="90%"
  >
    <UploadBox />
  </el-dialog>

  <div class="mobile-calculator">
    <div class="header">
      <h2>加权平均分计算器</h2>
      <div class="help-icon" @click="showExplanationModel">
        <el-icon><QuestionFilled /></el-icon>
      </div>
    </div>

    <div class="actions-bar">
      <el-button-group>
        <el-button type="primary" :icon="Upload" @click="showUploadDialog" size="small">
          贡献数据
        </el-button>
        <el-button type="primary" :icon="Upload" @click="triggerImport" size="small">
          导入
        </el-button>
        <el-button type="primary" :icon="Download" @click="exportData" size="small">
          导出
        </el-button>
      </el-button-group>
    </div>

    <div class="major-select">
      <el-select
        v-model="selectedMajor"
        placeholder="选择专业"
        clearable
        size="small"
        style="width: 100%"
      >
        <el-option
          v-for="major in majors"
          :key="major.value"
          :label="major.label"
          :value="major.value"
        />
      </el-select>
    </div>

    <div class="existing-gpa-card">
      <el-card>
        <div class="card-header">已有成绩信息（可选）</div>
        <div class="existing-gpa-form">
          <div class="input-group">
            <span class="input-label">已有加权平均分</span>
            <el-input-number
              v-model="existingGPA.score"
              :min="0"
              :max="100"
              :precision="2"
              size="small"
              controls-position="right"
            />
          </div>
          <div class="input-group">
            <span class="input-label">已有总学分</span>
            <el-input-number
              v-model="existingGPA.credits"
              :min="0"
              :precision="1"
              size="small"
              controls-position="right"
            />
          </div>
        </div>
      </el-card>
    </div>

    <div class="semester-filter">
      <el-select
        v-model="selectedSemester"
        placeholder="选择学期"
        clearable
        size="small"
        style="width: 100%"
      >
        <el-option
          v-for="semester in semesters"
          :key="semester"
          :label="semester"
          :value="semester"
        />
      </el-select>
      <div class="semester-actions">
        <el-button
          type="primary"
          @click="toggleSemesterSelection(selectedSemester, true)"
          :disabled="!selectedSemester"
          size="small"
        >
          全选该学期
        </el-button>
        <el-button
          type="info"
          @click="toggleSemesterSelection(selectedSemester, false)"
          :disabled="!selectedSemester"
          size="small"
        >
          取消该学期
        </el-button>
      </div>
    </div>

    <input
      type="file"
      ref="fileInputRef"
      @change="handleFileImport"
      accept=".json"
      style="display: none"
    >

    <div class="summary-cards-wrapper">
      <div class="summary-cards">
        <el-card class="summary-card">
          <div class="card-title">总学分</div>
          <div class="card-value">{{ totalCredits }}</div>
        </el-card>
        <el-card class="summary-card">
          <div class="card-title">加权平均分</div>
          <div class="card-value">{{ weightedAverage }}</div>
        </el-card>
      </div>
    </div>

    <div class="subjects-list">
      <div v-for="(subject, index) in subjects" :key="subject.id" class="subject-card">
        <el-divider v-if="shouldShowDivider(index)">
          <div class="divider-content">
            <span>第{{ getDividerText(index) }}学期</span>
            <div class="divider-actions">
              <el-button
                type="primary"
                size="small"
                link
                @click="toggleSemesterSelection(getDividerText(index), true)"
              >
                全选
              </el-button>
              <el-button
                type="info"
                size="small"
                link
                @click="toggleSemesterSelection(getDividerText(index), false)"
              >
                取消
              </el-button>
            </div>
          </div>
        </el-divider>
        <el-card>
          <div class="subject-header">
            <span class="subject-index">#{{ index + 1 }}</span>
            <div class="subject-actions">
              <el-checkbox v-model="subject.selected" />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click="removeSubject(index)"
                :disabled="subjects.length === 1"
              />
            </div>
          </div>

          <div class="subject-form">
            <div class="input-group">
                <span class="input-label">学期</span>
            
            <el-input
              v-model="subject.semester"
              placeholder="学期（可空）"
              size="small"
            />
        </div>

        <div class="input-group">
            <span class="input-label">课程名称</span>
            <el-input
              v-model="subject.name"
              placeholder="课程名称（可空）"
              size="small"
            />
        </div>
            <div class="number-inputs">
              <div class="input-group">
                <span class="input-label">学分</span>
                <el-input-number
                  v-model="subject.credit"
                  :min="0"
                  :max="20"
                  placeholder="学分"
                  size="small"
                  controls-position="right"
                />
              </div>
              <div class="input-group">
                <span class="input-label">成绩</span>
                <el-input-number
                  v-model="subject.score"
                  :min="0"
                  :max="100"
                  placeholder="成绩"
                  size="small"
                  controls-position="right"
                />
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="add-button">
      <el-button type="primary" :icon="Plus" @click="addSubject" circle />
    </div>
  </div>
</template>

<style scoped>
.mobile-calculator {
  padding: 1rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
}

.header h2 {
  margin: 0;
  color: #409EFF;
}

.help-icon {
  position: absolute;
  right: 0;
  cursor: pointer;
}

.actions-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.summary-cards-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #f5f7fa;
  padding: 0.5rem 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-card {
  text-align: center;
}

.card-title {
  font-size: 0.9rem;
  color: #909399;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.5rem;
  color: #409EFF;
  font-weight: bold;
}

.subjects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 4rem;
}

.subject-card {
  width: 100%;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.subject-index {
  color: #909399;
  font-size: 0.9rem;
}

.subject-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subject-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.number-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.add-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-label {
  color: #606266;
  font-size: 0.9rem;
  white-space: nowrap;
}

.major-select {
  margin: 1rem 0;
}

.summary-cards-wrapper::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(to bottom, rgba(245, 247, 250, 0.9), transparent);
  pointer-events: none;
}

.semester-filter {
  margin-bottom: 1rem;
}

.semester-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
}

.semester-filter {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
}

.divider-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.divider-actions {
  display: flex;
  gap: 0.5rem;
}

/* 确保分割线内容样式正确 */
:deep(.el-divider__text) {
  font-size: 14px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 0 8px;
}

/* 确保分割线内容不会换行 */
:deep(.el-divider__text.is-center) {
  white-space: nowrap;
}

.existing-gpa-card {
  margin: 1rem 0;
}

.card-header {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 1rem;
  text-align: center;
}

.existing-gpa-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.existing-gpa-form .input-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.existing-gpa-form .input-label {
  color: #606266;
  font-size: 0.9rem;
}

.existing-gpa-form :deep(.el-input-number) {
  width: 120px;
}
</style> 
