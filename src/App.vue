<template>
  <div class="editor">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.bold() }"
          @click="commands.bold"
        >
          <icon name="bold" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.italic() }"
          @click="commands.italic"
        >
          <icon name="italic" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.strike() }"
          @click="commands.strike"
        >
          <icon name="strike" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.underline() }"
          @click="commands.underline"
        >
          <icon name="underline" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code() }"
          @click="commands.code"
        >
          <icon name="code" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.paragraph() }"
          @click="commands.paragraph"
        >
          <icon name="paragraph" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.bullet_list() }"
          @click="commands.bullet_list"
        >
          <icon name="ul" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.ordered_list() }"
          @click="commands.ordered_list"
        >
          <icon name="ol" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.blockquote() }"
          @click="commands.blockquote"
        >
          <icon name="quote" />
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
        >
          <icon name="code" />
        </button>
      </div>
    </editor-menu-bar>

    <editor-content class="editor__content" :editor="editor" autoFocus />
    <suggestions ref="synsuggestions" :select="selectSuggestion" />

    <div class="suggestion-list" v-show="showSuggestions" ref="suggestions">
      <template v-if="hasResults">
        <div
          v-for="(user, index) in filteredUsers"
          :key="user.id"
          class="suggestion-list__item"
          :class="{ 'is-selected': navigatedUserIndex === index }"
          @click="selectUser(user)"
        >
          {{ user.name }}
        </div>
      </template>
      <div v-else class="suggestion-list__item is-empty">
        No users found
      </div>
    </div>
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar } from 'tiptap'
import {
  Blockquote,
  CodeBlock,
  HardBreak,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
  History,
  Image,
} from 'tiptap-extensions'
import Icon from './components/Icon'
import RegexMention from './extensions/regexMention'
import Mention from './extensions/mention'
import Suggestions from './suggestions'
import Fuse from 'fuse.js'
import tippy, { sticky } from 'tippy.js'

export default {
  components: {
    EditorContent,
    EditorMenuBar,
    Suggestions,
    Icon,
  },
  watch: {
    value(val) {
      if (this.editor) {
        this.editor.setContent(val, true)
      }
    },
  },
  props: ['value', 'setValue'],
  data() {
    return {
      editor: null,
      query: null,
      suggestionRange: null,
      filteredUsers: [],
      navigatedUserIndex: 0,
      insertMention: () => {},
    }
  },
  computed: {
    hasResults() {
      return this.filteredUsers.length
    },

    showSuggestions() {
      return this.query || this.hasResults
    },
  },
  mounted() {
    this.editor = new Editor({
      extensions: [
        new Blockquote(),
        new BulletList(),
        new CodeBlock(),
        new HardBreak(),
        new ListItem(),
        new OrderedList(),
        new TodoItem(),
        new TodoList(),
        new Link(),
        new Bold(),
        new Code(),
        new Italic(),
        new Strike(),
        new Underline(),
        new Image(),
        new History(),

        // Synonyms
        new RegexMention({
          matcher: /(\w*)\/s\b/,
          onEnter: async ({ items, query, range, command, virtualNode }) => {
            const synonyms = await this.getSynonyms(query)
            this.$refs.synsuggestions.onSuggestionStart({
              items: synonyms.map((i, index) => ({
                id: index,
                name: i,
                type: 'synonym',
              })),
              query,
              range,
              command,
              virtualNode,
            })
          },
          onChange: this.$refs.synsuggestions.onChange,
          onExit: this.$refs.synsuggestions.onExit,
          onKeyDown: this.$refs.synsuggestions.onKeyDown,
        }),

        // Sounds like
        new RegexMention({
          matcher: /(\w*)\/v\b/,
          onEnter: async ({ items, query, range, command, virtualNode }) => {
            const synonyms = await this.getSoundLike(query)
            this.$refs.synsuggestions.onSuggestionStart({
              items: synonyms.map((i, index) => ({
                id: index,
                name: i,
                type: 'sound_like',
              })),
              query,
              range,
              command,
              virtualNode,
            })
          },
          onChange: this.$refs.synsuggestions.onChange,
          onExit: this.$refs.synsuggestions.onExit,
          onKeyDown: this.$refs.synsuggestions.onKeyDown,
        }),

        // Rhymes
        new RegexMention({
          matcher: /(\w*)\/r\b/,
          onEnter: async ({ items, query, range, command, virtualNode }) => {
            const rhymes = await this.getRhymes(query)
            this.$refs.synsuggestions.onSuggestionStart({
              items: rhymes.map((i, index) => ({
                id: index,
                name: i,
                type: 'rhyme',
              })),
              query,
              range,
              command,
              virtualNode,
            })
          },
          onChange: this.$refs.synsuggestions.onChange,
          onExit: this.$refs.synsuggestions.onExit,
          onKeyDown: this.$refs.synsuggestions.onKeyDown,
        }),
      ],

      content: this.$root.value || '',
      onUpdate: ({ getHTML }) => {
        if (this.$root.setValue) {
          this.$root.setValue(getHTML())
        }
      },
    })
    this.editor.focus('end')
  },
  methods: {
    // Meaning like
    async getSynonyms(word) {
      const res = await fetch(
        `https://api.datamuse.com/words?ml=${word}`,
      ).then(r => r.json())

      return res.map(i => i.word)
    },

    // Sound like
    async getSoundLike(word) {
      const res = await fetch(
        `https://api.datamuse.com/words?sl=${word}`,
      ).then(r => r.json())

      return res.map(i => i.word)
    },

    // Rhyme
    async getRhymes(word) {
      const res = await fetch(
        `https://api.datamuse.com/words?rel_rhy=${word}`,
      ).then(r => r.json())

      return res.map(i => i.word)
    },

    selectSuggestion(suggestion) {
      switch (suggestion.type) {
        case 'synonym': {
          const { view, selection } = this.editor

          view.dispatch(
            view.state.tr.insertText(
              `${suggestion.name} `,
              selection.from -
                (2 + this.$refs.synsuggestions.suggestionQuery.length),
              // 2 symbols is "/s"
              selection.from,
            ),
          )
          break
        }

        case 'rhyme': {
          const { view, selection } = this.editor

          view.dispatch(
            view.state.tr.insertText(
              `${suggestion.name} `,
              selection.from -
                (2 + this.$refs.synsuggestions.suggestionQuery.length),
              // 2 symbols is "/r"
              selection.from,
            ),
          )
          break
        }

        case 'sound_like': {
          const { view, selection } = this.editor

          view.dispatch(
            view.state.tr.insertText(
              `${suggestion.name} `,
              selection.from -
                (2 + this.$refs.synsuggestions.suggestionQuery.length),
              // 2 symbols is "/v"
              selection.from,
            ),
          )
          break
        }

        default:
          break
      }

      this.$refs.synsuggestions.destroyPopup()
    },

    // navigate to the previous item
    // if it's the first item, navigate to the last one
    upHandler() {
      this.navigatedUserIndex =
        (this.navigatedUserIndex + this.filteredUsers.length - 1) %
        this.filteredUsers.length
    },

    // navigate to the next item
    // if it's the last item, navigate to the first one
    downHandler() {
      this.navigatedUserIndex =
        (this.navigatedUserIndex + 1) % this.filteredUsers.length
    },

    enterHandler() {
      const user = this.filteredUsers[this.navigatedUserIndex]

      if (user) {
        this.selectUser(user)
      }
    },

    // we have to replace our suggestion text with a mention
    // so it's important to pass also the position of your suggestion text
    selectUser(user) {
      this.insertMention({
        range: this.suggestionRange,
        attrs: {
          id: user.id,
          label: user.name,
        },
      })
      this.editor.focus()
    },

    // renders a popup with suggestions
    // tiptap provides a virtualNode object for using popper.js (or tippy.js) for popups
    renderPopup(node) {
      if (this.popup) {
        return
      }

      // ref: https://atomiks.github.io/tippyjs/v6/all-props/
      this.popup = tippy('.page', {
        getReferenceClientRect: node.getBoundingClientRect,
        appendTo: () => document.body,
        interactive: true,
        sticky: true, // make sure position of tippy is updated when content changes
        plugins: [sticky],
        content: this.$refs.suggestions,
        trigger: 'mouseenter', // manual
        showOnCreate: true,
        theme: 'dark',
        placement: 'top-start',
        inertia: true,
        duration: [400, 200],
      })
    },

    destroyPopup() {
      if (this.popup) {
        this.popup[0].destroy()
        this.popup = null
      }
    },
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy()
    }
  },
}
</script>
<style lang="scss">
@import './assets/sass/main.scss';
@import './assets/sass/suggestions.scss';
.mention {
  background: rgba(#000, 0.1);
  color: rgba(#000, 0.6);
  font-size: 0.8rem;
  font-weight: bold;
  border-radius: 5px;
  padding: 0.2rem 0.5rem;
  white-space: nowrap;
}
.mention-suggestion {
  color: rgba(#000, 0.6);
}
.suggestion-list {
  border: 1px solid rgba(#000, 0.1);
  font-size: 0.8rem;
  font-weight: 400;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.11);
  padding: 0.2rem;
  &__no-results {
    padding: 0.2rem 0.5rem;
  }
  &__item {
    border-radius: 5px;
    cursor: pointer;
    &:last-child {
      margin-bottom: 0;
    }
    &.is-selected,
    &:hover {
      background-color: rgba(#fff, 0.2);
    }
    &.is-empty {
      opacity: 0.5;
    }
  }
}
.tippy-box[data-theme~='dark'] {
  background-color: #000;
  padding: 0;
  font-size: 1rem;
  text-align: inherit;
  color: #fff;
  border-radius: 5px;
}
</style>
