import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const write = (file: string, content: string) => sandbox().pre('test-id', 'Write', { file_path: file, content })
const edit = (file: string, oldString: string, newString: string) =>
  sandbox().pre('test-id', 'Edit', { file_path: file, old_string: oldString, new_string: newString })

test('denies a native interactive element without a test id', () => {
  const result = write('src/components/ProfileForm.vue', '<template>\n  <button type="submit">Save</button>\n</template>')
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /\[craft:test-id\].*data-testid/)
})

test('denies every native interactive tag without a test id', () => {
  for (const tag of ['<a href="/items">', '<input v-model="name">', '<select v-model="kind">', '<textarea v-model="notes">', '<form @submit.prevent="save">']) {
    assert.strictEqual(write('src/components/ItemForm.vue', tag).status, 2, tag)
  }
})

test('denies any element with an event handler and no test id, in Vue and React', () => {
  const elements = [
    ['src/components/ItemCard.vue', '<div @click="open(item)">'],
    ['src/components/ItemCard.vue', '<BaseCard v-on:click="open(item)">'],
    ['src/components/ItemCard.tsx', '<Card onClick={open}>'],
    ['src/components/SearchBox.jsx', '<Field onChange={search} />'],
  ]
  for (const [file, element] of elements) {
    assert.strictEqual(write(file, element).status, 2, element)
  }
})

test('an arrow function inside a handler does not end the tag early', () => {
  assert.strictEqual(write('src/components/Menu.tsx', '<button onClick={() => setOpen(!open)}>Menu</button>').status, 2)
  assert.strictEqual(write('src/components/Menu.tsx', '<button onClick={() => setOpen(!open)} data-testid="menu-toggle">Menu</button>').status, 0)
})

test('denies a MultiEdit when any edit adds an interactive element without a test id', () => {
  const edits = [{ old_string: 'a', new_string: '<span>{{ total }}</span>' }, { old_string: 'b', new_string: '<button @click="save">' }]
  assert.strictEqual(sandbox().pre('test-id', 'MultiEdit', { file_path: 'src/App.vue', edits }).status, 2)
})

test('allows interactive elements with a static or bound test id', () => {
  const elements = [
    '<button data-testid="profile-save-button" @click="save">Save</button>',
    '<input :data-testid="`item-quantity-${item.sku}`" v-model="quantity">',
    '<Card data-testid={`item-card-${item.sku}`} onClick={open}>',
  ]
  for (const element of elements) {
    assert.strictEqual(write('src/components/Item.tsx', element).status, 0, element)
  }
})

test('allows a wrapper that forwards the attributes of the parent', () => {
  assert.strictEqual(write('src/components/BaseButton.vue', '<button class="btn" v-bind="$attrs">').status, 0)
  assert.strictEqual(write('src/components/Button.tsx', '<button className="btn" {...rest}>').status, 0)
})

test('allows elements that are not interactive', () => {
  const content = '<div class="card">\n  <span>{{ total }}</span>\n  <p>Text</p>\n  <input type="hidden" name="token">\n</div>'
  assert.strictEqual(write('src/components/Summary.vue', content).status, 0)
})

test('ignores TypeScript generics in a component file', () => {
  assert.strictEqual(write('src/components/Counter.tsx', 'const [count, setCount] = useState<number>(0)').status, 0)
})

test('allows any content in files outside the scope', () => {
  for (const file of ['src/components/ItemForm.test.tsx', 'tests/e2e/items.spec.ts', 'README.md', 'src/router.ts', 'app/Http/Controller.php']) {
    assert.strictEqual(write(file, '<button>Save</button>').status, 0, file)
  }
})

test('only the new text is checked, so editing a legacy component passes', () => {
  const result = edit('src/components/Legacy.vue', '<span>{{ old }}</span>', '<span>{{ total }}</span>')
  assert.strictEqual(result.status, 0)
})
