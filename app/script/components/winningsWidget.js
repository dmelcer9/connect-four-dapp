import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

export default class WinningsWidget extends React.Component{
  constructor(props){
    super(props);

    this.state={
      payout: "0",
      disableButton: false
    }

    this.repeatRefreshWidget(5000);
  }

  async repeatRefreshWidget(time){
    await this.refreshWidget();
    setTimeout(()=>this.repeatRefreshWidget(time), time);
  }

  async refreshWidget(){
    const account = this.props.account;
    const payout = String(await this.props.c4inst.payments.call(account,{from:account}));
    const humanPayout = this.props.web3.utils.fromWei(payout, "ether").toString();
    this.setState({
      payout: humanPayout
    });


  }

  async withdraw(){
    this.setState({
      disableButton: true
    });

    try{
      //For some reason MetaMask has a default gas limit that's too low for this
      await this.props.c4inst.withdrawPayments({from:this.props.account, gasLimit:50000});
    } catch(error){
      alert("There was an error when withdrawing payments, check console for details.");
      console.error(error);
    }

    this.refreshWidget();
    this.setState({
      disableButton: false
    });
  }

  render(){
    var opts = {};
    if (this.state.payout === "0") {
      opts['hidden'] = 'hidden';
    }

    return (
      <div {...opts} className="w3-panel">
        <div className="w3-card">
          <header className="w3-container w3-blue">
            <h2>Payout</h2>
          </header>

          <div className="w3-panel">
            You have a pending payout of <strong>{this.state.payout} Ether</strong>.

            <div className="w3-panel w3-border-red w3-border-left w3-pale-red">
              Warning: Some clients underestimate the amount of gas used for this operation.
              Make sure that the gas limit is at least 50000 or the transaction may not go through.
            </div>

            <button disabled={this.state.disableButton} className="w3-btn w3-blue" onClick={()=>this.withdraw()}>Withdraw</button>
          </div>

          <footer className="w3-container w3-blue">
            <h6>You have one or more payments from this contract that you can withdraw.</h6>
          </footer>
        </div>

      </div>
    )
  }

}

WinningsWidget.propTypes = {
  web3: PropTypes.any.isRequired,
  c4inst: PropTypes.any.isRequired,
  account: PropTypes.string.isRequired
}