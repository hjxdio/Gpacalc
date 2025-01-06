<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Delete, Upload, Download, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ExplanationBox from './ExplanationBox.vue'
import UploadBox from './UploadJson.vue'
import { type Subject, majors, validateSubjectData, calculateWeightedAverage, calculateTotalCredits, type ExistingGPA } from '../types/calculator'

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

const weightedAverage = computed(() => calculateWeightedAverage(subjects.value, existingGPA.value))

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
const showExplanationModel = ()=>{
  showExplanation.value = true
}
const showUploadDialog = ()=>{
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

const insertSubjectAfter = (index: number) => {
  subjects.value.splice(index + 1, 0, {
    id: nextId.value++,
    name: '',
    credit: 0,
    score: 0,
    semester: '',
    selected: true
  })
}

const totalCredits = computed(() => calculateTotalCredits(subjects.value, existingGPA.value))

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
    width="50%"
    draggable
  >
  <ExplanationBox/>
</el-dialog>


<el-dialog
    v-model="showUpload"
    title="贡献专业学科数据"
    width="50%"
    draggable
  >
    <UploadBox/>
  </el-dialog>


  <div class="calculator-container">
    <el-card class="calculator-card">
      <template #header>
        <div class="card-header">
          <h2>加权平均分计算器</h2>
          <div class="help-icon" @click="showExplanationModel" >
            <el-icon><QuestionFilled /></el-icon>
          </div>
          
          

          <div class="header-buttons">
            <el-button
        type="primary"
        :icon="Upload"
        @click="showUploadDialog"
        plain
      >
        贡献专业数据
      </el-button>
            <el-button
              type="primary"
              :icon="Upload"
              @click="triggerImport"
              plain
            >
              导入数据
            </el-button>
            <el-button
              type="primary"
              :icon="Download"
              @click="exportData"
              plain
            >
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      

      <input
        type="file"
        ref="fileInputRef"
        @change="handleFileImport"
        accept=".json"
        style="display: none"
      >

      <div class="major-select">
        <el-select
          v-model="selectedMajor"
          placeholder="选择专业"
          clearable
          class="major-select-input"
        >
          <el-option
            v-for="major in majors"
            :key="major.value"
            :label="major.label"
            :value="major.value"
          />
        </el-select>
      </div>

      <div class="existing-gpa">
        <el-card class="existing-gpa-card">
          <template #header>
            <div class="card-header">
              <span>已有成绩信息（可选）</span>
            </div>
          </template>
          <div class="existing-gpa-inputs">
            <div class="input-group">
              <label>已有加权平均分：</label>
              <el-input-number
                v-model="existingGPA.score"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="已有加权平均分"
                class="gpa-input"
              />
            </div>
            <div class="input-group">
              <label>已有总学分：</label>
              <el-input-number
                v-model="existingGPA.credits"
                :min="0"
                :precision="1"
                placeholder="已有总学分"
                class="credits-input"
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
          class="semester-select"
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

      <div class="summary">
        <el-alert
          :title="`总学分：${totalCredits}`"
          type="info"
          :closable="false"
        />
      </div>

      <div class="result">
        <el-alert
          :title="`加权平均分：${weightedAverage}`"
          type="success"
          :closable="false"
        />
      </div>

      <div class="subjects-list">
        <div class="subject-header">
          <div class="header-item index-column">#</div>
          <div class="header-item semester-input">学期</div>
          <div class="header-item subject-input">课程名称</div>
          <div class="header-item credit-input">学分</div>
          <div class="header-item score-input">分数</div>
          <div class="header-item checkbox-column">选择</div>
          <div class="header-item buttons-space"></div>
        </div>
        <template v-for="(subject, index) in subjects" :key="subject.id">
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
          <div class="subject-item">
            <div class="index-column">{{ index + 1 }}</div>
            <el-input
              v-model="subject.semester"
              placeholder="学期（可空）"
              class="semester-input"
            />
            <el-input
              v-model="subject.name"
              placeholder="课程名称（可空）"
              class="subject-input"
            />
            <el-input-number
              v-model="subject.credit"
              :min="0"
              :max="20"
              placeholder="学分"
              class="credit-input"
            />
            <el-input-number
              v-model="subject.score"
              :min="0"
              :max="100"
              placeholder="成绩"
              class="score-input"
            />
            <el-checkbox v-model="subject.selected" class="checkbox-column" />
            <div class="button-group">
              <el-button
                type="primary"
                :icon="Plus"
                circle
                @click="insertSubjectAfter(index)"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="removeSubject(index)"
                :disabled="subjects.length === 1"
              />
            </div>
          </div>
        </template>
      </div>


      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="addSubject">
          添加课程
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.calculator-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.calculator-card {
  background-color: #fff;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h2 {
  margin: 0;
  color: #409EFF;
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.subjects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subject-item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.subject-input {
  flex: 2;
}

.credit-input,
.score-input {
  flex: 1;
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.result {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.subject-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #606266;
}

.header-item {
  text-align: center;
}

.header-item.subject-input {
  flex: 1;
}

.header-item.credit-input,
.header-item.score-input {
  width: 120px;
  flex: none !important;
}

.header-item.button-space {
  width: 40px; 
}

.semester-input {
  width: 80px;
  flex: none !important;
}

.header-item.semester-input {
  width: 80px;
  flex: none !important;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.buttons-space {
  width: 90px; 
}

.header-item.buttons-space {
  width: 90px;
}

.index-column {
  width: 40px;
  text-align: center;
  color: #909399;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary {
  margin: 1rem 0;
}

.checkbox-column {
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.semester-filter {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.semester-select {
  width: 200px;
}

.semester-actions {
  display: flex;
  gap: 0.5rem;
}

.divider-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.divider-actions {
  display: flex;
  gap: 0.5rem;
}

.subjects-list :deep(.el-divider__text) {
  font-size: 14px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 0 8px;
}

.subjects-list :deep(.el-divider__text.is-center) {
  white-space: nowrap;
}

.help-icon {
  cursor: pointer;
  margin-left: 0.5rem;
}

.existing-gpa {
  margin: 1rem 0;
}

.existing-gpa-card {
  background-color: #f5f7fa;
}

.existing-gpa-inputs {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-group label {
  white-space: nowrap;
  color: #606266;
}

.gpa-input,
.credits-input {
  width: 150px;
}

</style>