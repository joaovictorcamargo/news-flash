import * as React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { StorySummaryFieldsFragment } from '../graphql/__generated__/operationTypes';
import { gql, useMutation } from 'urql';
import {
  AddBookmarkMutation,
  AddBookmarkMutationVariables,
  RemoveBookmarkMutation,
  RemoveBookmarkMutationVariables,
} from '../graphql/__generated__/operationTypes';
import { StorySummaryFields } from '../graphql/fragments';

const ADD_BOOKMARK_MUTATION = gql`
  mutation AddBookmark($storyId: ID!) {
    addBookmark(storyId: $storyId) {
      id
      story {
        ...StorySummaryFields
      }
    }
  }
  ${StorySummaryFields}
`;

const REMOVE_BOOKMARK_MUTATION = gql`
  mutation RemoveBookmark($bookmarkId: ID!) {
    removeBookmark(bookmarkId: $bookmarkId)
  }
`;

export const Story: React.FC<{
  item: StorySummaryFieldsFragment;
  cta: 'add' | 'remove';
}> = ({ item, cta }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [{ fetching: isAddingBookmark }, addBookmark] = useMutation<
    AddBookmarkMutation,
    AddBookmarkMutationVariables
  >(ADD_BOOKMARK_MUTATION);

  const [{ fetching: isRemovingBookmark }, removeBookmark] = useMutation<
    RemoveBookmarkMutation,
    RemoveBookmarkMutationVariables
  >(REMOVE_BOOKMARK_MUTATION);

  const handeAddBookmark = React.useCallback(async () => {
    const result = await addBookmark({ storyId: item.id });
    if (result.error && result.error.message.includes('You are offline!')) {
      Alert.alert(
        'You are offline!',
        'Please connect to the internet to add this story to your bookmarks',
      );
    }
  }, [addBookmark, item.id]);

  const handleRemoveBookmark = React.useCallback(async () => {
    const result = await removeBookmark({ bookmarkId: item.bookmarkId! });
    if (result.error && result.error.message.includes('You are offline!')) {
      Alert.alert(
        'You are offline!',
        'Please connect to the internet to remove this story from your bookmarks',
      );
    }
  }, [item.bookmarkId, removeBookmark]);

  return (
    <Pressable
      onPress={() =>
        navigation.navigate('StoryDetailsModal', {
          id: item.id,
          title: item.title,
        })
      }>
      <View style={styles.row}>
        <Text style={styles.title}>
          {item.title} {item.bookmarkId ? '🔖' : ''}
        </Text>
        {!item.bookmarkId && !isAddingBookmark && cta === 'add' ? (
          <Pressable onPress={handeAddBookmark}>
            <Text>Add Bookmark</Text>
          </Pressable>
        ) : null}
        {item.bookmarkId && !isRemovingBookmark && cta === 'remove' ? (
          <Pressable onPress={handleRemoveBookmark}>
            <Text>Remove Bookmark</Text>
          </Pressable>
        ) : null}
        {isAddingBookmark || isRemovingBookmark ? <ActivityIndicator /> : null}
      </View>
      <Text style={styles.summary}>{item.summary}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  summary: {
    fontSize: 18,
    color: 'grey',
  },
  row: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
