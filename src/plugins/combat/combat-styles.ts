import { equipAction, EquipActionData } from '@server/world/action/equip-action';
import { ItemDetails, WeaponStyle, weaponWidgetIds } from '@server/config/item-config';
import { widgets, widgetScripts } from '@server/world/config/widget';
import { Player, playerInitAction } from '@server/world/actor/player/player';
import { findItem } from '@server/config';
import { buttonAction } from '@server/world/action/button-action';
import { combatStyles } from '@server/world/actor/combat';


function updateCombatStyle(player: Player, weaponStyle: WeaponStyle, styleIndex: number): void {
    player.savedMetadata.combatStyle = [ weaponStyle, styleIndex ];
    player.settings.attackStyle = styleIndex;
    player.outgoingPackets.updateClientConfig(widgetScripts.attackStyle, styleIndex);
}

function showUnarmed(player: Player): void {
    player.modifyWidget(widgets.defaultCombatStyle, { childId: 0, text: 'Unarmed' });
    player.setSidebarWidget(0, widgets.defaultCombatStyle);
    let style = 0;
    if(player.savedMetadata.combatStyle) {
        style = player.savedMetadata.combatStyle[1] || null;
        if(style && style > 2) {
            style = 2;
        }
    }
    updateCombatStyle(player, 'unarmed', style);
}

function setWeaponWidget(player: Player, weaponStyle: WeaponStyle, itemDetails: ItemDetails): void {
    player.modifyWidget(weaponWidgetIds[weaponStyle], { childId: 0, text: itemDetails.name || 'Unknown' });
    player.setSidebarWidget(0, weaponWidgetIds[weaponStyle]);
    if(player.savedMetadata.combatStyle) {
        updateCombatStyle(player, weaponStyle, player.savedMetadata.combatStyle[1] || 0);
    }
}

const equip: equipAction = details => {
    const { player, itemDetails, equipmentSlot } = details;

    if(equipmentSlot === 'main_hand') {
        const weaponStyle = itemDetails?.equipmentData?.weaponInfo?.style || null;

        if(!weaponStyle) {
            showUnarmed(player);
            return;
        }

        setWeaponWidget(player, weaponStyle, itemDetails);
    }
};

const initAction: playerInitAction = details => {
    const { player } = details;

    const equippedItem = player.getEquippedItem('main_hand');
    if(equippedItem) {
        const itemDetails = findItem(equippedItem.itemId);
        const weaponStyle = itemDetails?.equipmentData?.weaponInfo?.style || null;

        if(weaponStyle) {
            setWeaponWidget(player, weaponStyle, itemDetails);
        } else {
            showUnarmed(player);
        }
    } else {
        showUnarmed(player);
    }
};

const combatStyleSelection: buttonAction = details => {
    const { player, buttonId } = details;

    const equippedItem = player.getEquippedItem('main_hand');
    let weaponStyle = 'unarmed';

    if(equippedItem) {
        weaponStyle = findItem(equippedItem.itemId)?.equipmentData?.weaponInfo?.style || null;
        if(!weaponStyle || !combatStyles[weaponStyle]) {
            weaponStyle = 'unarmed';
        }
    }

    const combatStyle = combatStyles[weaponStyle].findIndex(combatStyle => combatStyle.buttonId === buttonId);
    if(combatStyle) {
        player.savedMetadata.combatStyle = [ weaponStyle, combatStyle ];
    }
};

export default [{
    type: 'equip_action',
    equipType: 'EQUIP',
    action: equip
}, {
    type: 'equip_action',
    equipType: 'UNEQUIP',
    action: (details: EquipActionData): void => {
        if(details.equipmentSlot === 'main_hand') {
            showUnarmed(details.player);
        }
    }
}, {
    type: 'player_init',
    action: initAction
}, {
    type: 'button',
    widgetIds: Object.values(weaponWidgetIds),
    action: combatStyleSelection
}];
