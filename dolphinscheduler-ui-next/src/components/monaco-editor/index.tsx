/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  nextTick,
  ref,
  watch
} from 'vue'
import { useFormItem } from 'naive-ui/es/_mixins'
import { call } from 'naive-ui/es/_utils'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import type { MaybeArray, OnUpdateValue, OnUpdateValueImpl } from './types'

const props = {
  value: {
    type: String as PropType<string>,
    default: ''
  },
  defaultValue: {
    type: String as PropType<string>
  },
  'onUpdate:value': [Function, Array] as PropType<MaybeArray<OnUpdateValue>>,
  onUpdateValue: [Function, Array] as PropType<MaybeArray<OnUpdateValue>>,
  language: {
    type: String as PropType<string>,
    default: 'shell'
  },
  readOnly: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  options: {
    type: Object,
    default: () => {}
  }
}

// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (['css', 'scss', 'less'].includes(label)) {
      return new cssWorker()
    }
    if (['html', 'handlebars', 'razor'].includes(label)) {
      return new htmlWorker()
    }
    if (['typescript', 'javascript'].includes(label)) {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

export default defineComponent({
  name: 'MonacoEditor',
  props,
  emits: ['change', 'focus', 'blur'],
  setup(props, ctx) {
    let editor = null as monaco.editor.IStandaloneCodeEditor | null

    const editorRef = ref()

    const getValue = () => editor?.getValue()

    const formItem = useFormItem({})

    watch(
      () => props.value,
      (val) => {
        if (val !== getValue()) {
          editor?.setValue(val)
        }
      }
    )

    onMounted(async () => {
      await nextTick()
      const dom = editorRef.value
      if (dom) {
        editor = monaco.editor.create(dom, props.options, {
          value: props.defaultValue ?? props.value,
          language: props.language,
          readOnly: props.readOnly,
          automaticLayout: true
        })
        editor.onDidChangeModelContent(() => {
          const { onUpdateValue, 'onUpdate:value': _onUpdateValue } = props
          const value = editor?.getValue() || ''

          if (onUpdateValue) call(onUpdateValue as OnUpdateValueImpl, value)
          if (_onUpdateValue) call(_onUpdateValue as OnUpdateValueImpl, value)
          ctx.emit('change', value)

          formItem.nTriggerFormChange()
          formItem.nTriggerFormInput()
        })
        editor.onDidBlurEditorWidget(() => {
          ctx.emit('blur')
          formItem.nTriggerFormBlur()
        })
        editor.onDidFocusEditorWidget(() => {
          ctx.emit('focus')
          formItem.nTriggerFormFocus()
        })
      }
    })

    onUnmounted(() => {
      editor?.dispose()
    })

    ctx.expose({ getValue })

    return { editorRef }
  },
  render() {
    return (
      <div
        ref='editorRef'
        style={{
          height: '300px',
          width: '100%',
          border: '1px solid #eee'
        }}
      ></div>
    )
  }
})
