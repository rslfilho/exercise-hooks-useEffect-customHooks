import React, { createContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { getPostsBySubreddit } from '../services/redditAPI';

const Context = createContext();
const { Provider, Consumer } = Context;

const RedditProvider = (props) => {
  const [postsBySubreddit, setPostsBySubreddit] = useState({ frontend: {}, reactjs: {} });
  const [selectedSubreddit, setSelectedSubreddit] = useState('reactjs');
  const [shouldRefreshSubreddit, setShouldRefreshSubreddit] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchError = useCallback((error) => {
    setShouldRefreshSubreddit(false);
    setIsFetching(false);
    setPostsBySubreddit({
      ...postsBySubreddit,
      [selectedSubreddit]: {
        error: error.message,
        items: [],
      },
    });
  }, [postsBySubreddit, selectedSubreddit])

  const handleFetchSuccess = useCallback((json) => {
    const lastUpdated = Date.now();
    const items = json.data.children.map((child) => child.data);
    setShouldRefreshSubreddit(false);
    setIsFetching(false);
    setPostsBySubreddit({
      ...postsBySubreddit,
      [selectedSubreddit]: {
        items, 
        lastUpdated,
      },
    });
  }, [postsBySubreddit, selectedSubreddit])

  const shouldFetchPosts = useCallback(() => {
    const posts = postsBySubreddit[selectedSubreddit];

    if (!posts.items) return true;
    if (isFetching) return false;
    return shouldRefreshSubreddit;
  }, [isFetching, postsBySubreddit, selectedSubreddit, shouldRefreshSubreddit])


  const fetchPosts = useCallback(() => {
    if (!shouldFetchPosts()) return;

    setShouldRefreshSubreddit(false);
    setIsFetching(true);

    getPostsBySubreddit(selectedSubreddit)
      .then(handleFetchSuccess, handleFetchError);
  }, [selectedSubreddit, handleFetchError, handleFetchSuccess, shouldFetchPosts])

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, selectedSubreddit])

  const handleSubredditChange = (selectedSubreddit) => {
    setSelectedSubreddit(selectedSubreddit);
  }

  const handleRefreshSubreddit = () => {
    setShouldRefreshSubreddit(true);
  }

  const { children } = props;
  const context = {
    postsBySubreddit,
    selectedSubreddit,
    shouldRefreshSubreddit,
    isFetching,
    selectSubreddit: handleSubredditChange,
    fetchPosts: fetchPosts,
    refreshSubreddit: handleRefreshSubreddit,
    availableSubreddits: Object.keys(postsBySubreddit),
    posts: postsBySubreddit[selectedSubreddit].items,
  };

  return (
    <Provider value={context}>
      {children}
    </Provider>
  );
}

RedditProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { RedditProvider as Provider, Consumer, Context };