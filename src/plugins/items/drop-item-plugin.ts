import { itemAction } from '@server/world/action/item-action';
import { soundIds } from '@server/world/config/sound-ids';
import { getItemFromContainer } from '@server/world/items/item-container';
import { serverConfig } from '@server/game-server';
import { Rights } from '@server/world/actor/player/player';
import { widgets } from '@server/config';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';

export const action: itemAction = ({ player, itemId, itemSlot }) => {
    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    if(!serverConfig.adminDropsEnabled && player.rights === Rights.ADMIN) {
        dialogue([ player ], [
            text => ('Administrators are not allowed to drop items.'),
            options => [
                `Destroy the item!`, [
                    execute(() => {
                        inventory.remove(itemSlot);
                        player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
                    }),
                ],
                `Bank the item!`, [
                    execute(() => {
                        inventory.remove(itemSlot);
                        player.bank.add(item);
                        player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
                    }),
                ]
            ]
        ]);

        return;
    }

    inventory.remove(itemSlot);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
    player.playSound(soundIds.dropItem, 5);
    player.instance.spawnWorldItem(item, player.position, { owner: player, expires: 300 });
    player.actionsCancelled.next(null);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'drop',
    action,
    cancelOtherActions: false
};
