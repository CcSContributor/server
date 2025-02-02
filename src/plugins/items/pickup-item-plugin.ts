import { worldItemAction } from '@server/world/action/world-item-action';
import { Item } from '../../world/items/item';
import { soundIds } from '@server/world/config/sound-ids';
import { widgets } from '@server/config';


export const action: worldItemAction = ({ player, worldItem, itemDetails }) => {
    const inventory = player.inventory;
    const amount = worldItem.amount;
    let slot = -1

    if(itemDetails.stackable) {
        const existingItemIndex = inventory.findIndex(worldItem.itemId);
        if(existingItemIndex !== -1) {
            const existingItem = inventory.items[existingItemIndex];
            if(existingItem.amount + worldItem.amount >= 2147483647) {
                // @TODO create new item stack
                return;
            } else {
                slot = existingItemIndex;
            }
        }
    }

    if(slot === -1) {
        slot = inventory.getFirstOpenSlot();
    }

    if(slot === -1) {
        player.sendMessage(`You don't have enough free space to do that.`);
        return;
    }

    worldItem.instance.despawnWorldItem(worldItem);

    const item: Item = {
        itemId: worldItem.itemId,
        amount
    };

    const addedItem = inventory.add(item);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, addedItem.slot, addedItem.item);
    player.playSound(soundIds.pickupItem, 3);
    player.actionsCancelled.next(null);
};

export default {
    type: 'world_item_action',
    options: 'pick-up',
    action,
    walkTo: true
};
