<template>
    <div class="upload-content">
      你可以在这里上传学科数据，也可以
      <a href="https://github.com/hjxdio/hjxdio.github.io/issues/" target="_blank" rel="noopener">
        在 GitHub 上给我提交issue
      </a>
      <el-upload
        class="upload-demo"
        drag
        action=""
        :auto-upload="true"
        :before-upload="handleBeforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传 JSON 格式的成绩数据文件
          </div>
        </template>
      </el-upload>
      <el-form class="upload-form" :model="formData" :rules="rules" ref="formRef">
        <el-form-item label="专业名称" prop="major">
          <el-input v-model="formData.major" placeholder="请输入专业名称"></el-input>
        </el-form-item>
        <el-form-item label="用户昵称">
          <el-input v-model="formData.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
      </el-form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { UploadFilled } from '@element-plus/icons-vue'
  import { ref, reactive } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  
  const emit = defineEmits(['fileSelected'])
  const formRef = ref<FormInstance>()
  const formData = reactive({
    major: '',
    nickname: ''
  })
  
  const rules = reactive<FormRules>({
    major: [
      { required: true, message: '请输入专业名称', trigger: 'blur' }
    ]
  })
  
  const validateForm = async () => {
    if (!formRef.value) return false
    try {
      await formRef.value.validate()
      return true
    } catch (error) {
      return false
    }
  }
  
  const handleBeforeUpload = async (file: any) => {
    if (!await validateForm()) {
      ElMessage.error('请先填写专业名称')
      return false
    }
    
    const timestamp = new Date().getTime()
    const newFileName = `${formData.major}-${formData.nickname}-${timestamp}.json`
    const newFile = new File([file], newFileName, { type: file.type })
    emit('fileSelected', newFile)
    return newFile
  }
  

  const handleUploadSuccess = (response: any) => {
    console.log(response)
    if (response.code === 1) {
      ElMessage.success('文件上传成功')
    } else {
      ElMessage.error(response.message || '上传失败')
    }
  }
  
  const handleUploadError = (error: any) => {
    ElMessage.error('文件上传失败')
  }
  </script>
  
  <style scoped>
  .upload-form {
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
}

.el-form-item {
  margin-bottom: 15px;
}
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  
  .upload-demo {
    width: 100%;
    max-width: 400px;
  }
  
  .el-upload__text {
    margin: 1rem 0;
  }
  
  .el-upload__text em {
    color: #409EFF;
    font-style: normal;
  }
  
  .el-upload__tip {
    color: #909399;
    font-size: 14px;
    margin-top: 0.5rem;
  }
  </style>