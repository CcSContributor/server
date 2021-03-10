import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { ItemDetails } from '@engine/config/item-config';
import { findItem } from '@engine/config';
import { basicNumberFilter, basicStringFilter, questHookFilter } from '@engine/world/action/hook-filters';


/**
 * Defines an item action hook.
 */
export interface ItemActionHook extends ActionHook {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single UI widget ID or a list of widget IDs that this action applies to.
    widgets?: { widgetId: number, containerId: number } | { widgetId: number, containerId: number }[];
    // A single option name or a list of option names that this action applies to.
    options?: string | string[];
    // The action function to be performed.
    action: itemActionHandler;
    // Whether or not this item action should cancel other running or queued actions.
    cancelOtherActions?: boolean;
}


/**
 * The item action hook handler function to be called when the hook's conditions are met.
 */
export type itemActionHandler = (itemAction: ItemAction) => void;


/**
 * Details about an item action being performed.
 */
export interface ItemAction {
    // The player performing the action.
    player: Player;
    // The ID of the item being interacted with.
    itemId: number;
    // The container slot that the item being interacted with is in.
    itemSlot: number;
    // The ID of the UI widget that the item is in.
    widgetId: number;
    // The ID of the UI container that the item is in.
    containerId: number;
    // Additional details about the item.
    itemDetails: ItemDetails;
    // The option that the player used (ie "equip"  or "drop").
    option: string;
}


/**
 * The pipe that the game engine hands item actions off to.
 * @param player
 * @param itemId
 * @param slot
 * @param widgetId
 * @param containerId
 * @param option
 */
const itemActionPipe = (player: Player, itemId: number, slot: number, widgetId: number, containerId: number, option: string): void => {
    if(player.busy) {
        return;
    }

    let cancelActions = false;

    // Find all object action plugins that reference this location object
    let interactionActions = getActionHooks<ItemActionHook>('item_action', plugin => {
        if(!questHookFilter(player, plugin)) {
            return false;
        }

        if(plugin.itemIds !== undefined) {
            if(!basicNumberFilter(plugin.itemIds, itemId)) {
                return false;
            }
        }

        if(plugin.widgets !== undefined) {
            if(Array.isArray(plugin.widgets)) {
                let found = false;
                for(const widget of plugin.widgets) {
                    if(widget.widgetId === widgetId && widget.containerId === containerId) {
                        found = true;
                        break;
                    }
                }

                if(!found) {
                    return false;
                }
            } else {
                if(plugin.widgets.widgetId !== widgetId || plugin.widgets.containerId !== containerId) {
                    return false;
                }
            }
        }

        if(plugin.options !== undefined) {
            if(!basicStringFilter(plugin.options, option)) {
                return false;
            }
        }

        if(plugin.cancelOtherActions) {
            cancelActions = true;
        }
        return true;
    });

    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(
            `Unhandled item option: ${option} ${itemId} in slot ${slot} within widget ${widgetId}:${containerId}`);
        return;
    }

    if(cancelActions) {
        player.actionsCancelled.next(null);
    }

    for(const plugin of interactionActions) {
        plugin.action({
            player,
            itemId,
            itemSlot: slot,
            widgetId,
            containerId,
            itemDetails: findItem(itemId),
            option
        });
    }

};


/**
 * Item action pipe definition.
 */
export default [
    'item_action',
    itemActionPipe
];