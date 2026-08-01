Component({
  properties: {
    product: { type: Object, value: {} },
    showStock: { type: Boolean, value: true }
  },
  methods: {
    onTap() { this.triggerEvent('tap', { product: this.data.product }); },
    onAdd() { this.triggerEvent('add', { product: this.data.product }); }
  }
});
