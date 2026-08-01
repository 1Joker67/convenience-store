Component({
  properties: { order: { type: Object, value: {} } },
  methods: {
    onTap() { this.triggerEvent('tap', { order: this.data.order }); }
  }
});
