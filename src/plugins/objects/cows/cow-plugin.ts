import { objectAction } from '@server/world/action/object-action';
import { cache } from '@server/game-server';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/dialogue-action';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { itemIds } from '@server/world/config/item-ids';
import { objectIds } from '@server/world/config/object-ids';
import { itemOnObjectAction } from '@server/world/action/item-on-object-action';
import { LocationObjectDefinition } from '@runejs/cache-parser';
import { Player } from '@server/world/actor/player/player';
import { findNpc } from '@server/config';

function milkCow(details: { objectDefinition: LocationObjectDefinition, player: Player }): void {
    const { player, objectDefinition } = details;
    const emptyBucketItem = cache.itemDefinitions.get(itemIds.bucket);

    if (player.hasItemInInventory(itemIds.bucket)) {
        player.playAnimation(animationIds.milkCow);
        player.playSound(soundIds.milkCow, 7);
        player.removeFirstItem(itemIds.bucket);
        player.giveItem(itemIds.bucketOfMilk);
        player.sendMessage(`You milk the ${objectDefinition.name} and receive some milk.`);
    } else {
        const gillieId = findNpc('rs:gillie_groats').gameId;
        dialogueAction(player)
            .then(async d => d.npc(gillieId, DialogueEmote.LAUGH_1, [`Tee hee! You've never milked a cow before, have you?`]))
            .then(async d => d.player(DialogueEmote.CALM_TALK_1, ['Erm... No. How could you tell?']))
            .then(async d => d.npc(gillieId, DialogueEmote.LAUGH_2, [`Because you're spilling milk all over the floor. What a`, 'waste! You need something to hold the milk.']))
            .then(async d => d.player(DialogueEmote.CONSIDERING, [`Ah yes, I really should have guessed that one, shouldn't`, 'I?']))
            .then(async d => d.npc(gillieId, DialogueEmote.LAUGH_2, [`You're from the city aren't you... Try it again with a`, `${emptyBucketItem.name.toLowerCase()}.`]))
            .then(async d => d.player(DialogueEmote.CALM_TALK_2, [`Right, I'll do that.`]))
            .then(d => {
                d.close();
            });
    }
}

export const actionItem: itemOnObjectAction = (details) => milkCow(details);

export const actionInteract: objectAction = (details) => milkCow(details);

export default
[
    {
        type: 'object_action',
        objectIds: objectIds.milkableCow,
        options: 'milk',
        walkTo: true,
        action: actionInteract
    },
    {
        type: 'item_on_object',
        objectIds: objectIds.milkableCow,
        itemIds: itemIds.bucket,
        walkTo: true,
        action: actionItem
    }
];
