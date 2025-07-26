# 山洞奇遇

> 森林深处有一个神秘的山洞，似乎有什么秘密

当我们升级装备，打败森林里的狼，就来到了我们的山洞。当我们选择 `进去看看`，出现在我们眼前就有两条路：

1. 左边；
2. 右边；

这就是 `cave_inside` 场景。左边会直接通向一个结局场景，这个留到[结局](./end)再说。

## 右边

> 右边的道路弯弯绕绕，布满了藤曼和蝙蝠的大便。

为了给玩家制造困难，在右边我们设置了让玩家 `mp` 减 10 的触发效果。消耗体力才能到达下一个场景。

![图 0](/images/cave/94c8b60e67522521d134fa5a5ccee80e25c5bf960eefadae630f0ffa17755339.jpg)  

而为了避免 `mp` 出现负数，就需要在效果触发后看看玩家的**体力**是否已经被消耗为 0，然后在小于 0 时触发救治剧情。

这个逻辑就无法通过配置简单的效果来实现了。因此，就需要使用**函数调用**的触发效果实现。

![图 1](/images/cave/ada82789ba7e4618b08d66e9bd6f4306beb85db1cb91c441ea87700b9eae863c.jpg)  

我们通过设置一个函数来检查玩家的体力，然后在小于 0 时触发救治剧情。函数触发可以获得玩家的属性，背包物品列表，输入值等消息。另外提供了两个函数，可以修改玩家背包物品和属性。下面是函数的代码示例：

```js
function check(
　　profile: Profile,
　　inputText: string,
　　itemSelect: Inventory,
　　addItem: (name: string, count: number) => void,
　　setAttr: (attr: { key: string; name?: string; value: string }) => void
): boolean {
　　let message = "", next = null;
    /// 
    if (profile.attr.mp > 0) return { message, next }
    message = '你体力耗尽，晕厥了过去，被村里人发现。经过救治，终于恢复了。';
    addItem('gold', -10);
    setAttr({ key: 'mp', value: 50 });
    setAttr({ key: 'hp', value: 50 });
    next = 'village'
    ///
    return { message, next };
}
```
函数检查在最后执行，因此一开始就先检查玩家的体力是否已经见底。如果还没有，就可以继续到下一个场景。

如果已经见底了，那么就给玩家提示 `你体力耗尽，晕厥了过去，被村里人发现。经过救治，终于恢复了。`。同时执行三个操作：

1. 金币扣除 10 (作为医药费)；
2. `mp` 重置为 50；
3. `hp` 重置为 50；

接着我们重写掉 `next`，`next` 表示下一个场景。这里修改直接指向村庄。

这里我们可以看到，函数提供两个最基本的变量，提示语(`message`)和下一场景(`next`)，通过函数传入参数，我们可以做出判断，然后通过 `addItem` 函数修改玩家背包，`setAttr` 设置玩家状态。

关于选项函数的参数的更多信息，可以参考文档[选项的效果](../scene/effect#type)

## 深入山洞

山洞内剩下的场景，设置多与前面差不多，就不赘述了。
