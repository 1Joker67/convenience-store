Component({
  properties: { item: { type: Object, value: {} } },
  methods: {
    onIncrease() { this.triggerEvent('increase', { id: this.data.item._id }); },
    onDecrease() { this.triggerEvent('decrease', { id: this.data.item._id }); }
  }
});
