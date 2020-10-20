

        new Mention({
          matcher: {
            char: "@"
          },
          // a list of all suggested items
          items: () => {
            return [
              { id: 1, name: "Sven Adlung" },
              { id: 2, name: "Patrick Baber" },
              { id: 3, name: "Nick Hirche" },
              { id: 4, name: "Philip Isik" },
              { id: 5, name: "Timo Isik" },
              { id: 6, name: "Philipp Kühn" },
              { id: 7, name: "Hans Pagel" },
              { id: 8, name: "Sebastian Schrama" }
            ];
          },
          // is called when a suggestion starts
          onEnter: ({ items, query, range, command, virtualNode }) => {
            this.query = query;
            /* console.log("items"); */
            /* console.log(items.then(r => console.log(r)); */
            const itemss = items.then(r => {
              console.log("r");
              console.log(r);
              this.filteredUsers = r;
            });
            this.suggestionRange = range;
            this.renderPopup(virtualNode);
            // we save the command for inserting a selected mention
            // this allows us to call it inside of our custom popup
            // via keyboard navigation and on click
            this.insertMention = command;
          },
          // is called when a suggestion has changed
          onChange: ({ items, query, range, virtualNode }) => {
            this.query = query;
            this.filteredUsers = items;
            this.suggestionRange = range;
            this.navigatedUserIndex = 0;
            this.renderPopup(virtualNode);
          },
          // is called when a suggestion is cancelled
          onExit: () => {
            // reset all saved values
            this.query = null;
            this.filteredUsers = [];
            this.suggestionRange = null;
            this.navigatedUserIndex = 0;
            this.destroyPopup();
          },
          // is called on every keyDown event while a suggestion is active
          onKeyDown: ({ event }) => {
            if (event.key === "ArrowUp") {
              this.upHandler();
              return true;
            }

            if (event.key === "ArrowDown") {
              this.downHandler();
              return true;
            }

            if (event.key === "Enter") {
              this.enterHandler();
              return true;
            }

            return false;
          },
          // is called when a suggestion has changed
          // this function is optional because there is basic filtering built-in
          // you can overwrite it if you prefer your own filtering
          // in this example we use fuse.js with support for fuzzy search
          onFilter: async (items, query) => {
            if (!query) {
              return items;
            }

            await new Promise(resolve => {
              setTimeout(resolve, 500);
            });

            const fuse = new Fuse(items, {
              threshold: 0.2,
              keys: ["name"]
            });

            return fuse.search(query).map(item => item.item);
          }
        }),
