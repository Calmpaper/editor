<template>
  <div v-show="showSuggestions" ref="suggestions" class="suggestion-list">
    <div class="category">Pages</div>
    <template v-if="hasResults">
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="suggestion.id"
        class="suggestion-list__item"
        :class="{ 'is-selected': selectedIndex === index }"
        @click="onEnter(suggestion)"
      >
        {{ suggestion.name }}
      </div>
    </template>
    <div v-else class="suggestion-list__item is-empty">
      No users found
    </div>
  </div>
</template>

<script>
import tippy, { sticky } from "tippy.js";

export default {
  data() {
    return {
      items: [],
      suggestionQuery: null,
      suggestionRange: null,
      filteredSuggestions: [],
      selectedIndex: 0
    };
  },
  computed: {
    /* suggestionQuery: function(state) { */
    /*   return state.suggestions.suggestionQuery; */
    /* }, */
    /* suggestionRange: function(state) { */
    /*   return state.suggestions.suggestionRange; */
    /* }, */
    /* filteredSuggestions: function(state) { */
    /*   return state.suggestions.filteredSuggestions; */
    /* }, */
    /* selectedIndex: function(state) { */
    /*   return state.suggestions.selectedIndex; */
    /* }, */
    hasResults() {
      return this.filteredSuggestions.length;
    },
    showSuggestions() {
      return this.suggestionQuery || this.hasResults;
    }
  },

  beforeDestroy() {
    this.destroyPopup();
  },

  methods: {
    onSuggestionStart({ items, query, range, virtualNode }) {
      this.suggestionQuery = query;
      this.filteredSuggestions = items;
      this.suggestionRange = range;
      this.renderPopup(virtualNode);
    },

    onChange({ items, query, range, virtualNode }) {
      this.suggestionQuery = query;
      this.filteredSuggestions = items;
      this.suggestionRange = range;
      this.selectedIndex = 0;
      this.renderPopup(virtualNode);
    },

    onExit() {
      this.suggestionQuery = null;
      this.filteredSuggestions = [];
      this.suggestionRange = null;
      this.selectedIndex = 0;
      this.items = [];
      this.destroyPopup();
    },

    onUp() {
      this.selectedIndex =
        (this.selectedIndex + this.filteredSuggestions.length - 1) %
        this.filteredSuggestions.length;
    },

    onDown() {
      this.selectedIndex =
        (this.selectedIndex + 1) % this.filteredSuggestions.length;
    },

    /* onUp() { */
    /*   this.$store.commit("suggestions/onUp"); */
    /*   if (this.selectedIndex > 4) { */
    /*     this.$refs.suggestions.scrollTop -= 50; */
    /*   } */
    /* }, */

    /* onDown() { */
    /*   this.$store.commit("suggestions/onDown"); */
    /*   if (this.selectedIndex > 4) { */
    /*     this.$refs.suggestions.scrollTop += 50; */
    /*   } */
    /*   if (this.selectedIndex === this.filteredSuggestions.length - 1) { */
    /*     this.$refs.suggestions.scrollTop = 0; */
    /*   } */
    /* }, */

    onKeyDown({ event }) {
      if (event.key === "ArrowUp") {
        this.onUp();
        return true;
      }

      if (event.key === "ArrowDown") {
        this.onDown();
        return true;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        this.onEnter();
        return true;
      }

      return false;
    },

    onEnter() {
      const suggestion = this.filteredSuggestions[this.selectedIndex];

      if (suggestion) {
        this.$attrs.select(suggestion);
      }
    },

    renderPopup(node) {
      if (this.popup) {
        return;
      }

      this.popup = tippy(".page", {
        getReferenceClientRect: node.getBoundingClientRect,
        appendTo: () => document.body,
        interactive: true,
        sticky: true,
        plugins: [sticky],
        content: this.$refs.suggestions,
        trigger: "mouseenter",
        showOnCreate: true,
        theme: "dark",
        placement: "bottom-start",
        inertia: true,
        duration: [400, 200]
      });
    },

    destroyPopup() {
      if (this.popup) {
        /* this.popup[0].destroy() */
        this.popup = null;
      }
    }
  }
};
</script>
