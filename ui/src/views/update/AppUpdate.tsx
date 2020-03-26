import React from 'react';
import { UpdateStore } from '../../stores/update.store';
import { inject, observer } from 'mobx-react';
import { Icon, Progress, Modal, Tooltip } from 'antd';
import UpdateService from '../../services/update.service';

interface Props {
  updateStore?: UpdateStore;
}

interface State {
  modalVisible: boolean;
}

@inject('updateStore')
@observer
export default class AppUpdate extends React.Component<Props, State> {
  state: State = {
    modalVisible: false
  };

  hideModal() {
    this.setState({ modalVisible: false });
  }

  render() {
    if (this.props.updateStore!.state.isUpdating) {
      return (
        <div className="update">
          <Progress
            percent={Math.floor(this.props.updateStore!.state.percent)}
            status={this.props.updateStore!.state.percent === 100 ? 'success' : 'active'}
          />
        </div>
      );
    } else {
      return this.props.updateStore!.state.available ? (
        <div className="w-full">
          <Tooltip title="Update available">
            <span className="mr-2 text-link" onClick={() => UpdateService.doUpdate()}>
              <Icon type="download" className="mr-1" />
              <span>Update</span>
            </span>
          </Tooltip>
          <Tooltip title="Release Notes">
            <Icon
              className="text-link"
              type="info-circle"
              onClick={() => this.setState({ modalVisible: true })}
            />
          </Tooltip>
          <Modal
            title="Release Notes"
            visible={this.state.modalVisible}
            onOk={this.hideModal.bind(this)}
            onCancel={this.hideModal.bind(this)}
            footer={null}
          >
            <div
              className="release-notes"
              dangerouslySetInnerHTML={{ __html: this.props.updateStore!.state.releaseNotes }}
            ></div>
          </Modal>
        </div>
      ) : null;
    }
  }
}
