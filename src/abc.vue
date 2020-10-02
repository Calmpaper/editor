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
          :class="{ 'is-active': isActive.heading({ level: 1 }) }"
          @click="commands.heading({ level: 1 })"
        >
          H1
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >
          H2
        </button>

        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 3 }) }"
          @click="commands.heading({ level: 3 })"
        >
          H3
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

    <editor-content class="editor__content" :editor="editor" />
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
import { Editor, EditorContent, EditorMenuBar } from "tiptap";
import {
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
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
  Mention
} from "tiptap-extensions";
import Icon from "./components/Icon";
import RegexMention from "./extensions/regexMention";
import Suggestions from "./extensions/suggestions";
import Fuse from "fuse.js";
import tippy, { sticky } from "tippy.js";

export default {
  components: {
    EditorContent,
    EditorMenuBar,
    Suggestions,
    Icon
  },
  watch: {
    value(val) {
      if (this.editor) {
        this.editor.setContent(val, true);
      }
    }
  },
  props: ["value", "setValue"],
  data() {
    return {
      editor: null,
      query: null,
      suggestionRange: null,
      filteredUsers: [],
      filteredEmojis: [],
      navigatedUserIndex: 0,
      navigatedEmojiIndex: 0,
      insertMention: () => {}
    };
  },
  mounted() {
    this.editor = new Editor({
      extensions: [
        new Blockquote(),
        new BulletList(),
        new CodeBlock(),
        new HardBreak(),
        new Heading({ levels: [1, 2, 3] }),
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

        /* new Mention({ */
        /*   // a list of all suggested items */
        /*   items: async () => { */
        /*     await new Promise(resolve => { */
        /*       setTimeout(resolve, 500); */
        /*     }); */
        /*     return [ */
        /*       { id: 1, name: "Sven Adlung" }, */
        /*       { id: 2, name: "Patrick Baber" }, */
        /*       { id: 3, name: "Nick Hirche" }, */
        /*       { id: 4, name: "Philip Isik" }, */
        /*       { id: 5, name: "Timo Isik" }, */
        /*       { id: 6, name: "Philipp Kühn" }, */
        /*       { id: 7, name: "Hans Pagel" }, */
        /*       { id: 8, name: "Sebastian Schrama" } */
        /*     ]; */
        /*   }, */
        /*   // is called when a suggestion starts */
        /*   onEnter: ({ items, query, range, command, virtualNode }) => { */
        /*     this.query = query; */
        /*     this.filteredUsers = items; */
        /*     this.suggestionRange = range; */
        /*     this.renderPopup(virtualNode); */
        /*     // we save the command for inserting a selected mention */
        /*     // this allows us to call it inside of our custom popup */
        /*     // via keyboard navigation and on click */
        /*     this.insertMention = command; */
        /*   }, */
        /*   // is called when a suggestion has changed */
        /*   onChange: ({ items, query, range, virtualNode }) => { */
        /*     this.query = query; */
        /*     this.filteredUsers = items; */
        /*     this.suggestionRange = range; */
        /*     this.navigatedUserIndex = 0; */
        /*     this.renderPopup(virtualNode); */
        /*   }, */
        /*   // is called when a suggestion is cancelled */
        /*   onExit: () => { */
        /*     // reset all saved values */
        /*     this.query = null; */
        /*     this.filteredUsers = []; */
        /*     this.suggestionRange = null; */
        /*     this.navigatedUserIndex = 0; */
        /*     this.destroyPopup(); */
        /*   }, */
        /*   // is called on every keyDown event while a suggestion is active */
        /*   onKeyDown: ({ event }) => { */
        /*     if (event.key === "ArrowUp") { */
        /*       this.upHandler(); */
        /*       return true; */
        /*     } */

        /*     if (event.key === "ArrowDown") { */
        /*       this.downHandler(); */
        /*       return true; */
        /*     } */

        /*     if (event.key === "Enter") { */
        /*       this.enterHandler(); */
        /*       return true; */
        /*     } */

        /*     return false; */
        /*   }, */
        /*   // is called when a suggestion has changed */
        /*   // this function is optional because there is basic filtering built-in */
        /*   // you can overwrite it if you prefer your own filtering */
        /*   // in this example we use fuse.js with support for fuzzy search */
        /*   onFilter: async (items, query) => { */
        /*     if (!query) { */
        /*       return items; */
        /*     } */

        /*     await new Promise(resolve => { */
        /*       setTimeout(resolve, 500); */
        /*     }); */

        /*     const fuse = new Fuse(items, { */
        /*       threshold: 0.2, */
        /*       keys: ["name"] */
        /*     }); */

        /*     return fuse.search(query).map(item => item.item); */
        /*   } */
        /* }), */

        /* new Mention({ */
        /*   // a list of all suggested items */
        /*   matcher: { */
        /*     char: ":" */
        /*   }, */
        /*   items: async () => { */
        /*     await new Promise(resolve => { */
        /*       setTimeout(resolve, 500); */
        /*     }); */
        /*     return [ */
        /*       { id: 1, name: "🥰" }, */
        /*       { id: 2, name: "🤪" }, */
        /*       { id: 3, name: "🤨" }, */
        /*       { id: 4, name: "🧐" }, */
        /*       { id: 5, name: "🤯" }, */
        /*       { id: 6, name: "🥶" }, */
        /*       { id: 7, name: "🐯" }, */
        /*       { id: 8, name: "🙉" } */
        /*     ]; */
        /*   }, */
        /*   // is called when a suggestion starts */
        /*   onEnter: ({ items, query, range, command, virtualNode }) => { */
        /*     this.query = query; */
        /*     this.filteredEmojis = items; */
        /*     this.suggestionRange = range; */
        /*     this.renderPopup(virtualNode); */
        /*     // we save the command for inserting a selected mention */
        /*     // this allows us to call it inside of our custom popup */
        /*     // via keyboard navigation and on click */
        /*     this.insertMention = command; */
        /*   }, */
        /*   // is called when a suggestion has changed */
        /*   onChange: ({ items, query, range, virtualNode }) => { */
        /*     this.query = query; */
        /*     this.filteredEmojis = items; */
        /*     this.suggestionRange = range; */
        /*     this.navigatedUserIndex = 0; */
        /*     this.renderPopup(virtualNode); */
        /*   }, */
        /*   // is called when a suggestion is cancelled */
        /*   onExit: () => { */
        /*     // reset all saved values */
        /*     this.query = null; */
        /*     this.filteredEmojis = []; */
        /*     this.suggestionRange = null; */
        /*     this.navigatedUserIndex = 0; */
        /*     this.destroyPopup(); */
        /*   }, */
        /*   // is called on every keyDown event while a suggestion is active */
        /*   onKeyDown: ({ event }) => { */
        /*     if (event.key === "ArrowUp") { */
        /*       this.upEmojiHandler(); */
        /*       return true; */
        /*     } */

        /*     if (event.key === "ArrowDown") { */
        /*       this.downEmojiHandler(); */
        /*       return true; */
        /*     } */

        /*     if (event.key === "Enter") { */
        /*       this.enterEmojiHandler(); */
        /*       return true; */
        /*     } */

        /*     return false; */
        /*   }, */
        /*   // is called when a suggestion has changed */
        /*   // this function is optional because there is basic filtering built-in */
        /*   // you can overwrite it if you prefer your own filtering */
        /*   // in this example we use fuse.js with support for fuzzy search */
        /*   onFilter: async (items, query) => { */
        /*     if (!query) { */
        /*       return items; */
        /*     } */

        /*     await new Promise(resolve => { */
        /*       setTimeout(resolve, 500); */
        /*     }); */

        /*     const fuse = new Fuse(items, { */
        /*       threshold: 0.2, */
        /*       keys: ["name"] */
        /*     }); */

        /*     return fuse.search(query).map(item => item.item); */
        /*   } */
        /* }), */
        new RegexMention({
          matcher: {
            char: "@"
          },
          onEnter: () => {},
          onChange: () => {},
          onExit: () => {},
          onKeyDown: () => {}
          /* onEnter: async ({ items, query, range, command, virtualNode }) => { */
          /*   const recipes = await this.getRecipes(query) */
          /*   this.$refs.suggestions.onSuggestionStart({ */
          /*     items: recipes.map((i, index) => ({ */
          /*       id: index, */
          /*       name: i.title, */
          /*       recipeId: i.id, */
          /*       type: 'recipe' */
          /*     })), */
          /*     query, */
          /*     range, */
          /*     command, */
          /*     virtualNode */
          /*   }) */
          /* }, */
          /* onChange: this.$refs.suggestions.onChange, */
          /* onExit: this.$refs.suggestions.onExit, */
          /* onKeyDown: this.$refs.suggestions.onKeyDown */
        }),

        new RegexMention({
          matcher: /(\w*)\/s\b/,
          onEnter: async ({ items, query, range, command, virtualNode }) => {
            const synonyms = await this.getSynonyms(query);
            this.$refs.synsuggestions.onSuggestionStart({
              items: synonyms.map((i, index) => ({
                id: index,
                name: i,
                type: "synonym"
              })),
              query,
              range,
              command,
              virtualNode
            });
          },
          onChange: this.$refs.synsuggestions.onChange,
          onExit: this.$refs.synsuggestions.onExit,
          onKeyDown: this.$refs.synsuggestions.onKeyDown
        }),

        // Rhymes
        new RegexMention({
          matcher: /(\w*)\/rhy\b/,
          onEnter: async ({ items, query, range, command, virtualNode }) => {
            const rhymes = await this.getRhymes(query);
            this.$refs.synsuggestions.onSuggestionStart({
              items: rhymes.map((i, index) => ({
                id: index,
                name: i,
                type: "rhyme"
              })),
              query,
              range,
              command,
              virtualNode
            });
          },
          onChange: this.$refs.synsuggestions.onChange,
          onExit: this.$refs.synsuggestions.onExit,
          onKeyDown: this.$refs.synsuggestions.onKeyDown
        })
      ],
      content: this.$root.value || "",
      onUpdate: ({ getHTML }) => {
        if (this.$root.setValue) {
          this.$root.setValue(getHTML());
        }
      }
    });
  },

  computed: {
    hasResults() {
      return this.filteredUsers.length;
    },
    hasEmojiResults() {
      return this.filteredEmojis.length;
    },
    showSuggestions() {
      return this.query || this.hasResults;
    },
    showEmojiSuggestions() {
      return this.query || this.hasEmojiResults;
    }
  },
  methods: {
    async getSynonyms(word) {
      const res = await fetch(
        `https://wordsapiv1.p.rapidapi.com/words/${word}/synonyms`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
            "x-rapidapi-key":
              "14b00a912dmshc29f3d5dd244910p17f6a9jsnecfe9e250ed2"
          }
        }
      ).then(r => r.json());
      return res.synonyms;
    },

    async getRhymes(word) {
      const res = await fetch(
        `https://wordsapiv1.p.rapidapi.com/words/${word}/rhymes`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
            "x-rapidapi-key":
              "14b00a912dmshc29f3d5dd244910p17f6a9jsnecfe9e250ed2"
          }
        }
      ).then(r => r.json());
      return res.rhymes.all;
    },
    selectSuggestion(suggestion) {
      switch (suggestion.type) {
        case "mention": {
          const { view, selection } = this.editor;

          view.dispatch(
            view.state.tr.insertText(
              `${suggestion.name}`,
              selection.from - (1 + this.suggestionQuery.length),
              selection.from
            )
          );
          this.$router.push(suggestion.url);
          break;
        }

        case "synonym": {
          const { view, selection } = this.editor;

          view.dispatch(
            view.state.tr.insertText(
              `${suggestion.name}`,
              selection.from - (2 + this.suggestionQuery.length),
              selection.from
            )
          );
          break;
        }

        case "rhyme": {
          const { view, selection } = this.editor;

          view.dispatch(
            view.state.tr.insertText(
              `${suggestion.name}`,
              selection.from - (4 + this.suggestionQuery.length),
              selection.from
            )
          );
          break;
        }

        default:
          break;
      }

      this.$refs.synsuggestions.destroyPopup();
    },
    // navigate to the previous item
    // if it's the first item, navigate to the last one
    upHandler() {
      this.navigatedUserIndex =
        (this.navigatedUserIndex + this.filteredUsers.length - 1) %
        this.filteredUsers.length;
    },
    upEmojiHandler() {
      this.navigatedEmojiIndex =
        (this.navigatedEmojiIndex + this.filteredEmojis.length - 1) %
        this.filteredEmojis.length;
    },

    // navigate to the next item
    // if it's the last item, navigate to the first one
    downHandler() {
      this.navigatedUserIndex =
        (this.navigatedUserIndex + 1) % this.filteredUsers.length;
    },
    downEmojiHandler() {
      this.navigatedEmojiIndex =
        (this.navigatedEmojiIndex + 1) % this.filteredEmojis.length;
    },

    enterHandler() {
      const user = this.filteredUsers[this.navigatedUserIndex];

      if (user) {
        this.selectUser(user);
      }
    },
    enterEmojiHandler() {
      const user = this.filteredEmojis[this.navigatedEmojiIndex];

      if (user) {
        this.selectUser(user);
      }
    },

    // we have to replace our suggestion text with a mention
    // so it's important to pass also the position of your suggestion text
    selectUser(user) {
      this.insertMention({
        range: this.suggestionRange,
        attrs: {
          id: user.id,
          label: user.name
        }
      });
      this.editor.focus();
    },

    // renders a popup with suggestions
    // tiptap provides a virtualNode object for using popper.js (or tippy.js) for popups
    renderPopup(node) {
      if (this.popup) {
        return;
      }

      // ref: https://atomiks.github.io/tippyjs/v6/all-props/
      this.popup = tippy(".page", {
        getReferenceClientRect: node.getBoundingClientRect,
        appendTo: () => document.body,
        interactive: true,
        sticky: true, // make sure position of tippy is updated when content changes
        plugins: [sticky],
        content: this.$refs.suggestions,
        trigger: "mouseenter", // manual
        showOnCreate: true,
        theme: "dark",
        placement: "top-start",
        inertia: true,
        duration: [400, 200]
      });
    },

    destroyPopup() {
      if (this.popup) {
        this.popup[0].destroy();
        this.popup = null;
      }
    }
  },
  beforeDestroy() {
    this.editor.destroy();
  }
};
</script>
<style lang="scss">
@import "./assets/sass/main.scss";
</style>
