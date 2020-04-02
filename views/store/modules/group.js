import * as api from '../../api'
import Vue from 'vue'
export default {
  namespaced: true,
  mutations: {
    SET_VALUE(state, payload) {
      state.list = payload
    },
    SET_GROUPS_ALL(state, payload) {
      // state.groupOptions = payload
      Vue.set(state, 'groupOptions', payload)
    }
  },
  actions: {
    FETCH({ commit }, keywords) {
      return api.group
        .getList({
          params: { keywords }
        })
        .then(res => {
          if (res.data.success && !keywords) commit('SET_VALUE', res.data.data)
          return res.data
        })
    },
    ADD({ dispatch }, groupName) {
      return api.group
        .create({
          data: {
            name: groupName
          }
        })
        .then(res => {
          if (res.data.success) {
            return dispatch('FETCH')
          }
          return res.data
        })
    },
    JOIN({ dispatch }, id) {
      return api.group
        .join({
          data: { id }
        })
        .then(res => {
          if (res.data.success) {
            return dispatch('FETCH')
          }
          return res.data
        })
    },
    REMOVE({ dispatch }, groupId) {
      return api.group
        .delete({
          data: { id: groupId }
        })
        .then(res => {
          if (res.data.success) {
            return dispatch('FETCH')
          }
          return res.data
        })
    },
    RENAME({ dispatch }, group) {
      return api.group
        .update({
          data: {
            id: group.id,
            name: group.name
          }
        })
        .then(res => {
          if (res.data.success) {
            return dispatch('FETCH')
          }
          return res.data
        })
    },
    ALL({ dispatch, commit }) {
      return api.group.all().then(res => {
        if (res.data.success) {
          commit('SET_GROUPS_ALL', res.data.data)
        }
        return res.data
      })
    }
  }
}
