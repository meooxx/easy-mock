<template>
  <div class="em-editor">
    <div class="em-editor__editor">
      <div ref="codeEditor"></div>
    </div>
    <div class="panel-info">
      <em-spots :size="10"></em-spots>
      <div class="wrapper">
        <h2>{{isEdit ? $t('p.detail.editor.title[0]') : $t('p.detail.editor.title[1]')}}</h2>
        <Tabs>
          <TabPane label="设置接口">
            <div class="em-editor__form">
              <Form label-position="top">
                <Form-item label="Method">
                  <i-select v-model="temp.method">
                    <Option
                      v-for="item in methods"
                      :value="item.value"
                      :key="item.value"
                    >{{ item.label }}</Option>
                  </i-select>
                </Form-item>
                <Form-item label="URL">
                  <i-input v-model="temp.url">
                    <span slot="prepend">/</span>
                  </i-input>
                </Form-item>
                <Form-item :label="$t('p.detail.columns[0]')">
                  <i-input v-model="temp.description"></i-input>
                </Form-item>
                <Form-item :label="$t('p.detail.columns[2]')">
                  <i-input v-model="temp.tag"></i-input>
                </Form-item>
                <Form-item :label="$t('p.detail.editor.autoClose')">
                  <i-switch v-model="autoClose"></i-switch>
                </Form-item>
                <Form-item>
                  <Button
                    type="primary"
                    long
                    @click="submit"
                  >{{isEdit ? $t('p.detail.editor.action[0]') : $t('p.detail.editor.action[1]')}}</Button>
                </Form-item>
              </Form>
            </div>
            <div class="em-editor__control">
              <div class="em-proj-detail__switcher">
                <ul>
                  <li @click="format">{{$t('p.detail.editor.control[0]')}}</li>
                  <li @click="preview">{{$t('p.detail.editor.control[1]')}}</li>
                  <li @click="close">{{$t('p.detail.editor.control[2]')}}</li>
                </ul>
              </div>
            </div>
          </TabPane>
          <TabPane label="设置请求参数">
            <Badge :count="params.length">
              <Button class="add-param" @click="addParam">add param</Button>
            </Badge>

            <template>
              <div v-if="params.length>0" class="em-editor__param">
                <Form
                  label-position="top"
                  v-for="param in params"
                  :value="param.field"
                  :key="param._id"
                  class="add-param-form"
                >
                  <a @click="delParam(param._id)" class="del">删除</a>
                  <Form-item label="类型">
                    <i-select v-model="param.type">
                      <Option
                        v-for="item in paramsType"
                        :value="item.value"
                        :key="item.value"
                      >{{ item.label }}</Option>
                    </i-select>
                  </Form-item>

                  <Form-item label="字段">
                    <i-input v-model="param.field"></i-input>
                  </Form-item>
                  <Form-item label="错误信息">
                    <i-input v-model="param.errMsg"></i-input>
                  </Form-item>
                  <Form-item label="必填?">
                    <i-switch v-model="param.required"></i-switch>
                  </Form-item>
                </Form>
              </div>
            </template>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<style>
@import './index.css';
</style>

<script>
import * as api from '../../api'
import jsBeautify from 'js-beautify/js/lib/beautify'
let ace

if (typeof window !== 'undefined') {
  ace = require('brace')
  require('brace/mode/javascript')
  require('brace/theme/monokai')
  require('brace/ext/language_tools')
  require('brace/ext/searchbox')
  require('./snippets')
}

export default {
  name: 'editor',
  asyncData({ store, route }) {
    const { projectId, id } = route.params
    if (!id) return
    return store.dispatch('mock/GET_MOCK_DATA', { projectId, id })
  },
  data() {
    return {
      codeEditor: null,
      autoClose: false,
      methods: [
        { label: 'get', value: 'get' },
        { label: 'post', value: 'post' },
        { label: 'put', value: 'put' },
        { label: 'delete', value: 'delete' },
        { label: 'patch', value: 'patch' }
      ],
      paramsType: [
        { label: 'String', value: 'String' },
        { label: 'Object', value: 'Object' },
        { label: 'Array', value: 'Array' },
        { label: 'Number', value: 'Number' }
      ],
      temp: {
        url: '',
        mode: '{"code":200, "message":"ok", "result": {},}',
        method: 'get',
        description: '',
        tag: ''
      },
      params: [
        {
          _id: this.getId()
          // field: 'param'
        }
      ]
    }
  },
  computed: {
    mockData() {
      return this.$store.state.mock.editorData.mock
    },
    baseUrl() {
      const { projectUrl, projectId } = this.$store.state.mock.editorData
      if (projectUrl && projectId) {
        const baseUrl = location.origin + '/mock/' + projectId
        return projectUrl === '/' ? baseUrl : baseUrl + projectUrl
      }

      return this.$store.state.mock.editorData.baseUrl
    },
    projectId() {
      return this.$route.params.projectId
    },
    isEdit() {
      return !!this.$route.params.id && this.mockData
    }
  },
  beforeRouteEnter(to, from, next) {
    // if (from.matched.length === 0) {
    // 防止编辑页刷新导致的显示异常（直接进入项目主页）
    //  return next({
    //    path: `/project/${to.params.projectId}`,
    //    replace: true
    //  })
    // }
    next()
  },
  mounted() {
    this.codeEditor = ace.edit(this.$refs.codeEditor)
    this.codeEditor.getSession().setMode('ace/mode/javascript')
    this.codeEditor.setTheme('ace/theme/monokai')
    this.codeEditor.setOption('tabSize', 2)
    this.codeEditor.setOption('fontSize', 15)
    this.codeEditor.setOption('enableLiveAutocompletion', true)
    this.codeEditor.setOption('enableSnippets', true)
    this.codeEditor.clearSelection()
    this.codeEditor.getSession().setUseWorker(false)
    this.codeEditor.on('change', this.onChange)
    this.codeEditor.commands.addCommand({
      name: 'save',

      bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
      exec: () => {
        this.submit()
      }
    })
    if (this.isEdit) {
      // this.autoClose = true
      this.temp.url = this.mockData.url.slice(1) // remove /
      this.temp.mode = this.mockData.mode
      this.temp.method = this.mockData.method
      this.temp.description = this.mockData.description
      this.temp.tag = this.mockData.tag
      this.$nextTick(() => {
        this.temp.method = this.mockData.method
      })
      this.params = this.mockData.queryParams
    }

    this.$nextTick(() => {
      this.codeEditor.setValue(this.temp.mode)
      this.format()
    })
    this.$nextTick(() => {
      this.inititalTemp = { ...this.temp }
    })
    window.onbeforeunload = e => {
      if (!this.isDity()) return
      e = e || window.event
      // 兼容IE8和Firefox 4之前的版本
      if (e) {
        e.returnValue = '关闭提示'
      }
      // Chrome, Safari, Firefox 4+, Opera 12+ , IE 9+
      return '正在编辑要退出吗?'
    }
  },
  beforeDestroy() {
    window.onbeforeunload = null
  },
  beforeRouteLeave(to, from, next) {
    if (this.isDity()) {
      this.$Modal.confirm({
        title: '确定离开?',
        content: '<p>编辑内容尚未保存呢!</p>',
        onOk: next,
        onCancel: () => {
          next(false)
        }
      })
    } else {
      next()
    }

    // console.log(to, from, next)
  },
  methods: {
    convertUrl(url) {
      const newUrl = '/' + url
      return newUrl === '/'
        ? '/'
        : newUrl.replace(/\/\//g, '/').replace(/\/$/, '')
    },
    format() {
      const context = this.codeEditor.getValue()
      let code = /^http(s)?/.test(context)
        ? context
        : jsBeautify.js_beautify(context, { indent_size: 2 })
      this.codeEditor.setValue(code)
    },
    onChange() {
      this.temp.mode = this.codeEditor.getValue()
    },
    close() {
      this.$store.commit('mock/SET_EDITOR_DATA', {
        mock: null,
        baseUrl: ''
      })
      this.$router.replace(`/project/${this.projectId}`)
    },
    reload(mock, baseUrl) {
      this.$store.commit('mock/SET_EDITOR_DATA', {
        mock,
        baseUrl
      })
      this.$router.replace(`/editor/${this.projectId}/${mock._id}`)
      // this.$router.replace(`/project/${this.projectId}`)
    },
    submit() {
      const mockUrl = this.convertUrl(this.temp.url)
      try {
        const value = new Function(`return ${this.temp.mode}`)() // eslint-disable-line
        if (!value) {
          this.$Message.error(this.$t('p.detail.editor.submit.error[0]'))
          return
        } else if (typeof value !== 'object') {
          throw new Error()
        }
      } catch (error) {
        if (!/^http(s)?:\/\//.test(this.temp.mode)) {
          this.$Message.error(
            error.message || this.$t('p.detail.editor.submit.error[1]')
          )
          return
        }
      }
      if (this.isEdit) {
        api.mock
          .update({
            data: {
              ...this.temp,
              id: this.mockData._id,
              url: mockUrl,
              queryParams: this.params
            }
          })
          .then(res => {
            if (res.data.success) {
              this.$Message.success(
                this.$t('p.detail.editor.submit.updateSuccess')
              )
              this.inititalTemp = this.temp
              if (this.autoClose) this.close()
            }
          })
      } else {
        const queryParams = this.params
          .filter(p => !!p.field)
          .map(({ _id, ...rest }) => rest)
        api.mock
          .create({
            data: {
              ...this.temp,
              url: mockUrl,
              project_id: this.projectId,
              queryParams
            }
          })
          .then(res => {
            if (res.data.success) {
              const { mock, projectUrl } = res.data.data
              this.$Message.success(this.$t('p.detail.create.success'))
              this.inititalTemp = this.temp
              this.reload(mock, this.getBaseUrl(projectUrl))
            }
          })
      }
    },
    getBaseUrl(projectUrl) {
      const baseUrl = location.origin + '/mock/' + this.projectId
      return projectUrl === '/' ? baseUrl : baseUrl + projectUrl
    },
    preview() {
      window.open(
        this.baseUrl + this.mockData.url + '#!method=' + this.mockData.method
      )
    },
    isDity() {
      const keys = Object.keys(this.inititalTemp)
      for (let key of keys) {
        if (this.inititalTemp[key] !== this.temp[key]) return true
      }
      return false
    },
    getId() {
      return Math.random()
        .toString()
        .replace('.', '')
    },
    addParam() {
      const defaultParam = {
        _id: this.getId()
      }
      this.params.push(defaultParam)
      // console.log(this.temp.params)
    },
    delParam(id) {
      this.params = this.params.filter(p => p._id !== id)
    }
  }
}
</script>
