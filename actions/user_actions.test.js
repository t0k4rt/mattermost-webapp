// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import {Preferences} from 'mattermost-redux/constants';

import * as UserActions from 'actions/user_actions';

const mockStore = configureStore([thunk]);

jest.mock('mattermost-redux/actions/users', () => {
    const original = require.requireActual('mattermost-redux/actions/users');
    return {
        ...original,
        getProfilesInTeam: (...args) => ({type: 'MOCK_GET_PROFILES_IN_TEAM', args}),
        getProfilesInChannel: (...args) => ({type: 'MOCK_GET_PROFILES_IN_CHANNEL', args}),
    };
});

jest.mock('mattermost-redux/actions/teams', () => {
    const original = require.requireActual('mattermost-redux/actions/teams');
    return {
        ...original,
        getTeamMembersByIds: (...args) => ({type: 'MOCK_GET_TEAM_MEMBERS_BY_IDS', args}),
    };
});

jest.mock('mattermost-redux/actions/channels', () => {
    const original = require.requireActual('mattermost-redux/actions/channels');
    return {
        ...original,
        getChannelMembersByIds: (...args) => ({type: 'MOCK_GET_CHANNEL_MEMBERS_BY_IDS', args}),
    };
});

jest.mock('mattermost-redux/actions/preferences', () => {
    const original = require.requireActual('mattermost-redux/actions/preferences');
    return {
        ...original,
        deletePreferences: (...args) => ({type: 'MOCK_DELETE_PREFERENCES', args}),
        savePreferences: (...args) => ({type: 'MOCK_SAVE_PREFERENCES', args}),
    };
});

describe('Actions.User', () => {
    const initialState = {
        entities: {
            channels: {
                currentChannelId: 'current_channel_id',
                myMembers: {
                    current_channel_id: {
                        channel_id: 'current_channel_id',
                        user_id: 'current_user_id',
                        roles: 'channel_role',
                        mention_count: 1,
                        msg_count: 9,
                    },
                },
                channels: {
                    current_channel_id: {
                        total_msg_count: 10,
                        team_id: 'team_1',
                    },
                },
                channelsInTeam: {
                    team_1: ['current_channel_id'],
                },
                membersInChannel: {
                    current_channel_id: {
                        current_user_id: {id: 'current_user_id'},
                    },
                },
            },
            preferences: {
                myPreferences: {
                    'theme--team_1': {
                        category: 'theme',
                        name: 'team_1',
                        user_id: 'current_user_id',
                        value: JSON.stringify(Preferences.THEMES.mattermostDark),
                    },
                },
            },
            teams: {
                currentTeamId: 'team_1',
                teams: {
                    team_1: {
                        id: 'team_1',
                        name: 'team-1',
                        displayName: 'Team 1',
                    },
                    team_2: {
                        id: 'team_2',
                        name: 'team-2',
                        displayName: 'Team 2',
                    },
                },
                myMembers: {
                    team_1: {roles: 'team_role'},
                    team_2: {roles: 'team_role'},
                },
                membersInTeam: {
                    team_1: {
                        current_user_id: {id: 'current_user_id'},
                    },
                    team_2: {
                        current_user_id: {id: 'current_user_id'},
                    },
                },
            },
            users: {
                currentUserId: 'current_user_id',
            },
        },
    };

    test('loadProfilesAndTeamMembers', async () => {
        const expectedActions = [{type: 'MOCK_GET_PROFILES_IN_TEAM', args: ['team_1', 0, 60]}];

        let testStore = await mockStore({});
        await testStore.dispatch(UserActions.loadProfilesAndTeamMembers(0, 60, 'team_1'));
        let actualActions = testStore.getActions();
        expect(actualActions[0].args).toEqual(expectedActions[0].args);
        expect(actualActions[0].type).toEqual(expectedActions[0].type);

        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadProfilesAndTeamMembers(0, 60));
        actualActions = testStore.getActions();
        expect(actualActions[0].args).toEqual(expectedActions[0].args);
        expect(actualActions[0].type).toEqual(expectedActions[0].type);
    });

    test('loadProfilesAndTeamMembersAndChannelMembers', async () => {
        const expectedActions = [{type: 'MOCK_GET_PROFILES_IN_CHANNEL', args: ['current_channel_id', 0, 60]}];

        let testStore = await mockStore({});
        await testStore.dispatch(UserActions.loadProfilesAndTeamMembersAndChannelMembers(0, 60, 'team_1', 'current_channel_id'));
        let actualActions = testStore.getActions();
        expect(actualActions[0].args).toEqual(expectedActions[0].args);
        expect(actualActions[0].type).toEqual(expectedActions[0].type);

        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadProfilesAndTeamMembersAndChannelMembers(0, 60));
        actualActions = testStore.getActions();
        expect(actualActions[0].args).toEqual(expectedActions[0].args);
        expect(actualActions[0].type).toEqual(expectedActions[0].type);
    });

    test('loadTeamMembersForProfilesList', async () => {
        const expectedActions = [{args: ['team_1', ['other_user_id']], type: 'MOCK_GET_TEAM_MEMBERS_BY_IDS'}];

        // should call getTeamMembersByIds since 'other_user_id' is not loaded yet
        let testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadTeamMembersForProfilesList([{id: 'other_user_id'}], 'team_1'));
        expect(testStore.getActions()).toEqual(expectedActions);

        // should not call getTeamMembersByIds since 'current_user_id' is already loaded
        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadTeamMembersForProfilesList([{id: 'current_user_id'}], 'team_1'));
        expect(testStore.getActions()).toEqual([]);

        // should not call getTeamMembersByIds since no or empty profile is passed
        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadTeamMembersForProfilesList([], 'team_1'));
        expect(testStore.getActions()).toEqual([]);
    });

    test('loadTeamMembersAndChannelMembersForProfilesList', async () => {
        const expectedActions = [
            {args: ['team_1', ['other_user_id']], type: 'MOCK_GET_TEAM_MEMBERS_BY_IDS'},
            {args: ['current_channel_id', ['other_user_id']], type: 'MOCK_GET_CHANNEL_MEMBERS_BY_IDS'},
        ];

        // should call getTeamMembersByIds and getChannelMembersByIds since 'other_user_id' is not loaded yet
        let testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadTeamMembersAndChannelMembersForProfilesList([{id: 'other_user_id'}], 'team_1', 'current_channel_id'));
        expect(testStore.getActions()).toEqual(expectedActions);

        // should not call getTeamMembersByIds/getChannelMembersByIds since 'current_user_id' is already loaded
        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadTeamMembersForProfilesList([{id: 'current_user_id'}], 'team_1', 'current_channel_id'));
        expect(testStore.getActions()).toEqual([]);

        // should not call getTeamMembersByIds/getChannelMembersByIds since no or empty profile is passed
        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadTeamMembersForProfilesList([], 'team_1', 'current_channel_id'));
        expect(testStore.getActions()).toEqual([]);
    });

    test('loadChannelMembersForProfilesList', async () => {
        const expectedActions = [{args: ['current_channel_id', ['other_user_id']], type: 'MOCK_GET_CHANNEL_MEMBERS_BY_IDS'}];

        // should call getChannelMembersByIds since 'other_user_id' is not loaded yet
        let testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadChannelMembersForProfilesList([{id: 'other_user_id'}], 'current_channel_id'));
        expect(testStore.getActions()).toEqual(expectedActions);

        // should not call getChannelMembersByIds since 'current_user_id' is already loaded
        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadChannelMembersForProfilesList([{id: 'current_user_id'}], 'current_channel_id'));
        expect(testStore.getActions()).toEqual([]);

        // should not call getChannelMembersByIds since no or empty profile is passed
        testStore = await mockStore(initialState);
        await testStore.dispatch(UserActions.loadChannelMembersForProfilesList([], 'current_channel_id'));
        expect(testStore.getActions()).toEqual([]);
    });

    test('saveTheme for a specific team', async () => {
        const {currentUserId} = initialState.entities.users;
        const {currentTeamId} = initialState.entities.teams;
        const expectedActions = [{
            args: [
                currentUserId,
                [{
                    category: 'theme',
                    name: currentTeamId,
                    user_id: currentUserId,
                    value: JSON.stringify(Preferences.THEMES.mattermostDark),
                }],
            ],
            type: 'MOCK_SAVE_PREFERENCES',
        }];
        const testStore = await mockStore(initialState);

        await testStore.dispatch(UserActions.saveTheme(currentTeamId, Preferences.THEMES.mattermostDark));
        expect(testStore.getActions()).toEqual(expectedActions);
    });

    test('saveTheme for a all teams', async () => {
        const {currentUserId} = initialState.entities.users;
        const {currentTeamId} = initialState.entities.teams;
        const expectedActions = [{
            args: [
                currentUserId,
                [{
                    category: 'theme',
                    name: '',
                    user_id: currentUserId,
                    value: JSON.stringify(Preferences.THEMES.mattermostDark),
                }],
            ],
            type: 'MOCK_SAVE_PREFERENCES',
        }, {
            args: [
                currentUserId,
                [{
                    category: 'theme',
                    name: currentTeamId,
                    user_id: currentUserId,
                }],
            ],
            type: 'MOCK_DELETE_PREFERENCES',
        }];
        const testStore = await mockStore(initialState);

        await testStore.dispatch(UserActions.saveTheme('', Preferences.THEMES.mattermostDark));
        expect(testStore.getActions()).toEqual(expectedActions);
    });
});
