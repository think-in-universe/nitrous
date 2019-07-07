import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import * as transactionActions from 'app/redux/TransactionReducer';
import * as globalActions from 'app/redux/GlobalReducer';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import {
    LIQUID_TOKEN_UPPERCASE,
    PROMOTED_POST_ACCOUNT,
} from 'app/client_config';
import tt from 'counterpart';

class RatePost extends Component {
    static propTypes = {
        author: PropTypes.string.isRequired,
        permlink: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            trxError: '',
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.errorCallback = this.errorCallback.bind(this);
    }

    errorCallback(estr) {
        this.setState({ trxError: estr, loading: false });
    }

    onSubmit(e) {
        e.preventDefault();
        const { author, permlink, rating, onClose } = this.props;
        const { amount } = this.state;
        this.setState({ loading: true });
        console.log('-- RatePost.onSubmit -->');
        this.props.dispatchSubmit({
            author,
            permlink,
            rating,
            onClose,
            currentUser: this.props.currentUser,
            errorCallback: this.errorCallback,
        });
    }

    render() {
        const { amount, loading, amountError, trxError } = this.state;
        const { currentUser, rating } = this.props;

        const submitDisabled = !rating;

        return (
            <div className="RatePost row">
                <div className="column small-12">
                    <form onSubmit={this.onSubmit}>
                        <h4>{tt('rate_post_jsx.rate_post')}</h4>
                        <p>{tt('rate_post_jsx.rate_post_and_get_vote')}.</p>
                        <hr />
                        <div className="row">
                            <div className="column small-7 medium-5 large-4">
                                {tt('rate_post_jsx.confirm_rate_post', {
                                    rating,
                                })}
                            </div>
                        </div>
                        <br />
                        {loading && (
                            <span>
                                <LoadingIndicator type="circle" />
                                <br />
                            </span>
                        )}
                        {!loading && (
                            <span>
                                {trxError && (
                                    <div className="error">{trxError}</div>
                                )}
                                <button
                                    type="submit"
                                    className="button"
                                    disabled={submitDisabled}
                                >
                                    {tt('g.confirm')}
                                </button>
                            </span>
                        )}
                    </form>
                </div>
            </div>
        );
    }
}

// const AssetBalance = ({onClick, balanceValue}) =>
//     <a onClick={onClick} style={{borderBottom: '#A09F9F 1px dotted', cursor: 'pointer'}}>Balance: {balanceValue}</a>

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current']);
        return { ...ownProps, currentUser };
    },

    // mapDispatchToProps
    dispatch => ({
        dispatchSubmit: ({
            author,
            permlink,
            rating,
            currentUser,
            onClose,
            errorCallback,
        }) => {
            const username = currentUser.get('username');

            const successCallback = () => {
                // dispatch(
                //     globalActions.getState({ url: `@${username}/transfers` })
                // );
                onClose();
            };
            // const operation = {
            //     id: 'ssc-mainnet1',
            //     required_auths: [username],
            //     json: JSON.stringify(transferOperation),
            //     __config: {
            //         successMessage:
            //             tt(
            //                 'promote_post_jsx.you_successfully_promoted_this_post'
            //             ) + '.',
            //     },
            // };
            const operation = {
                ...linkProps,
                category: rootCategory,
                title,
                body,
                json_metadata: meta,
                __config,
            };
            dispatch(
                transactionActions.broadcastOperation({
                    type: 'comment',
                    operation,
                    errorCallback,
                    successCallback,
                })
            );
        },
    })
)(RatePost);
