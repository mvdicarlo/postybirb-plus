import React from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Modal, Radio } from 'antd';

interface Props {
  visible: boolean;
  file: File;
  onSubmit: (file: File) => void;
  onClose: () => void;
}

interface State {
  aspectRatio?: number;
}

export default class SubmissionImageCropper extends React.Component<Props, State> {
  state: State = { aspectRatio: undefined };
  private cropper: any;

  resolveCroppedImg() {
    const { naturalWidth, naturalHeight } = this.cropper.getCanvasData();
    const canvas = this.cropper.getCroppedCanvas();
    if (canvas.height !== naturalHeight || canvas.width !== naturalWidth) {
      canvas.toBlob(blob => {
        const file = new File([blob], this.props.file.name, { type: this.props.file.type });
        this.props.onSubmit(file);
      });
    } else {
      this.props.onSubmit(this.props.file);
    }
  }

  render() {
    return (
      <Modal
        title={
          <div className="flex">
            <div className="flex-1">Modify Thumbnail</div>
            <div className="flex-1">
              <span className="mr-1">Aspect Ratio</span>
              <Radio.Group
                defaultValue={this.state.aspectRatio}
                onChange={e => this.setState({ aspectRatio: e.target.value })}
              >
                <Radio value={undefined}>None</Radio>
                <Radio value={1}>1:1</Radio>
                <Radio value={4 / 3}>4:3</Radio>
                <Radio value={16 / 9}>16:9</Radio>
              </Radio.Group>
            </div>
          </div>
        }
        visible={this.props.visible}
        destroyOnClose={true}
        onCancel={() => {
          this.props.onClose();
        }}
        wrapClassName="fullscreen-modal-with-footer"
        mask={false}
        okText="Save"
        onOk={this.resolveCroppedImg.bind(this)}
      >
        <div className="w-full h-full text-center">
          {this.props.file ? (
            <Cropper
              style={{ height: '100%', width: '100%' }}
              autoCropArea={1}
              aspectRatio={this.state.aspectRatio || NaN}
              guides={false}
              zoomable={false}
              movable={false}
              src={this.props.file['path']}
              ref={cropper => {
                this.cropper = cropper;
              }}
            />
          ) : null}
        </div>
      </Modal>
    );
  }
}
