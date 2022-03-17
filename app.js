const Observable = (input) => {
    const deps = {};
    let effect = null;
    const _app = {
        ...input.data(),
    };

    // base proxy
    const _appProxy = new Proxy(_app, {
        get(target, key) {
            if (!deps[key]) {
                deps[key] = new Set();
            }
            effect && deps[key].add(effect);
            return target[key];
        },
        set(target, key, value) {
            target[key] = value;
            const _deps = deps[key];
            if (_deps) {
                _deps.forEach((effect) => {
                    return effect.call(_appProxy);
                });
            }
            return true;
        },
    });

    // computed proxy
    // init methods
    _app.methods = {};
    Object.keys(input.methods).forEach((key) => {
        _app.methods[key] = input.methods[key].bind(_app);
    });

    // init computed -- convert computeds to getters
    Object.keys(input.computed).forEach((key) => {
        Object.defineProperty(_appProxy, key, {
            get() {
                effect = input.computed[key];
                const res = effect.call(_appProxy);
                effect = null;
                return res;
            },
        });
    });
    return _appProxy;
};

const App = Observable({
    data() {
        return {
            price: 300,
            fee: 10,
        };
    },
    computed: {
        totalSpend() {
            return this.price + this.fee;
        },
    },

    methods: {
        price_up() {
            this.price++;
        },
        price_down() {
            this.price--;
        },

        fee_up() {
            this.fee++;
        },
        fee_down() {
            this.fee--;
        },
    },
});

const render = () => {
    const appElem = document.getElementById("app");
    appElem.innerHTML = `
    <table class="table">
            <tbody>
                <tr>
                    <td class="bold"><p>product price</p></td>
                    <td class="price bold" >${App.price}$</td>
                    <td>
                        <div class="btn-group-vertical" role="group" aria-label="First group">
                            <button type="button" class="btn btn-secondary" @click="price_up">+</button>
                            <button type="button" class="btn btn-secondary" @click="price_down">-</button>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="bold">Fee</td>
                    <td class="price bold">${App.fee}%</td>
                    <td>
                        <div class="btn-group-vertical" role="group" aria-label="First group">
                            <button type="button" class="btn btn-secondary" @click="fee_up">+</button>
                            <button type="button" class="btn btn-secondary" @click="fee_down">-</button>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="bold">Total</td>
                    <td class="price bold">${App.totalSpend}$</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    `;
};

render();

document.addEventListener("click", (e) => {
    const customClickAttr = e.target.attributes;
    // get click attribute from list of attributes
    const clickAttr = customClickAttr.getNamedItem("@click");
    if (clickAttr) {
        const methodName = clickAttr.value;
        App.methods[methodName]();
        render();
    }
});
