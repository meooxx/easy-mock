import * as api from '../../api'

export default {
  namespaced: true,
  mutations: {
    SET_VALUE(state, payload) {
      state.list =
        state.pageIndex === 1 ? payload.mocks : state.list.concat(payload.mocks)
      state.project = payload.project
      state.tags = payload.tags
    },
    INIT_REQUEST(state) {
      state.keywords = ''
      state.pageIndex = 1
      state.project = {}
      state.list = []
    },
    SET_REQUEST_PARAMS(state, payload) {
      state.keywords = payload.keywords || state.keywords
      state.pageIndex = payload.pageIndex || state.pageIndex
    },
    SET_EDITOR_DATA(state, { mock, baseUrl = '', projectUrl, projectId }) {
      state.editorData = {
        ...this.state.editorData,
        mock,
        baseUrl,
        projectUrl,
        projectId
      }
    }
  },
  actions: {
    FETCH({ commit, state, rootState }, route) {
      return api.mock
        .getList({
          params: {
            project_id: route.params.id,
            page_size: 2000, // 不考虑接口分页
            page_index: state.pageIndex,
            keywords: state.keywords
          }
        })
        .then(res => {
          if (res.data.success) {
            commit('SET_VALUE', res.data.data)
            state.pageIndex += 1
            commit('SET_REQUEST_PARAMS', { pageIndex: state.pageIndex })
            return res.data.data
          }
        })
    },
    GET_MOCK_DATA({ commit }, params) {
      return api.mock
        .getMockData({
          params
        })
        .then(res => {
          // console.log(res.data)
          if (res.data.success) {
            const { mock } = res.data.data
            const { project, ...rest } = mock
            // if (!project) return
            commit('SET_EDITOR_DATA', {
              mock: rest,
              projectUrl: project.url,
              projectId: project._id
            })
          }
          return res
        })
    },
    CREATE(
      { commit, dispatch },
      { tag = '', route, mode, description, url, method, queryParams = [] }
    ) {
      return api.mock
        .create({
          data: {
            mode,
            url,
            method,
            description,
            queryParams,
            tag,
            project_id: route.params.id
          }
        })
        .then(res => {
          if (res.data.success) {
            commit('SET_REQUEST_PARAMS', { pageIndex: 1 })
            dispatch('FETCH', route)
          }
          return res
        })
    }
  }
}
